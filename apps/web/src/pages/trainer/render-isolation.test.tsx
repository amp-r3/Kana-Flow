// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, options } from 'preact';
import type { VNode } from 'preact';
import { TrainerPage } from './ui/trainer-page';
import { TopBar } from './ui/top-bar';
import { ConfigBar } from './ui/config-bar';
import { RowsDialog } from './ui/rows-dialog';
import { createTrainer } from '@/features/training';
import type { PromptItem } from '@/entities/prompt';

describe('render isolation: TypingController keystrokes do not re-render static controls', () => {
  let container: HTMLDivElement;
  let prevDiffed: ((vnode: VNode) => void) | undefined;

  let topBarRenders = 0;
  let configBarRenders = 0;
  let rowsDialogRenders = 0;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    topBarRenders = 0;
    configBarRenders = 0;
    rowsDialogRenders = 0;
    prevDiffed = options.diffed?.bind(options);
  });

  afterEach(() => {
    if (prevDiffed) {
      options.diffed = prevDiffed;
    } else {
      delete options.diffed;
    }
    render(null, container);
    container.remove();
  });

  it('renders trainer page and dispatches 20 keystrokes with 0 renders of TopBar, ConfigBar, RowsDialog', () => {
    const prompt: PromptItem = { key: 'basic:a', text: 'あ' };
    const trainer = createTrainer({ nextPrompt: () => prompt });
    const controller = trainer.session;

    // Initial render of page
    render(<TrainerPage trainer={trainer} />, container);

    // Load initial prompt
    controller.loadPrompt(prompt, 'learner');

    // Reset render counters after initial mount
    topBarRenders = 0;
    configBarRenders = 0;
    rowsDialogRenders = 0;

    // Attach diffed hook to track re-renders
    options.diffed = (vnode: VNode) => {
      if (vnode.type === TopBar) {
        topBarRenders++;
      } else if (vnode.type === ConfigBar) {
        configBarRenders++;
      } else if (vnode.type === RowsDialog) {
        rowsDialogRenders++;
      }
      if (prevDiffed) {
        prevDiffed(vnode);
      }
    };

    // Dispatch 20 keystrokes through the controller
    for (let i = 0; i < 20; i++) {
      controller.handleIntent({ kind: 'char', char: 'a' });
    }

    // TopBar, ConfigBar, and RowsDialog must remain isolated and render 0 times during keystroke dispatch
    expect(topBarRenders).toBe(0);
    expect(configBarRenders).toBe(0);
    expect(rowsDialogRenders).toBe(0);
  });
});
