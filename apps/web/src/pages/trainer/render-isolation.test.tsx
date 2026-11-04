// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, options, Fragment } from 'preact';
import type { VNode } from 'preact';
import { TrainerPage } from './ui/trainer-page';
import { createTrainer } from '@/features/training';
import type { Trainer } from '@/features/training';
import type { PromptItem } from '@/entities/prompt';
import { setTestConfig } from '@/entities/settings';

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 30));

// Spec "Hot path" (D16): a keystroke that does not complete a prompt renders no component, and one
// that completes a prompt renders at most one, the stream. Every component render of the page is
// counted, from the very first key (which starts the test) on.
describe('render isolation: the hot path renders nothing', () => {
  const neko: PromptItem = { key: 'word:neko', text: 'ねこ' };

  let container: HTMLDivElement;
  let trainer: Trainer;
  let input: HTMLInputElement;
  let prevDiffed: ((vnode: VNode) => void) | undefined;

  beforeEach(async () => {
    setTestConfig({ kind: 'time', seconds: 120 });
    container = document.createElement('div');
    document.body.appendChild(container);
    trainer = createTrainer({ nextPrompt: () => neko });
    render(<TrainerPage trainer={trainer} />, container);
    await settle();
    const found = container.querySelector('input');
    if (found === null) throw new Error('no input field');
    input = found;
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
    document.documentElement.removeAttribute('data-testing');
  });

  /** Presses a key in the field and returns the components that rendered because of it. */
  async function press(key: string): Promise<string[]> {
    const rendered: string[] = [];
    options.diffed = (vnode: VNode) => {
      // A Fragment wraps a list of children; it is Preact's, not a component of ours.
      if (typeof vnode.type === 'function' && vnode.type !== Fragment) {
        rendered.push(vnode.type.name);
      }
      if (prevDiffed) prevDiffed(vnode);
    };
    input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    // Preact renders on a microtask; give it its turn before looking.
    await tick();
    if (prevDiffed) {
      options.diffed = prevDiffed;
    } else {
      delete options.diffed;
    }
    return rendered;
  }

  it('the first key, which starts the test, renders nothing', async () => {
    expect(trainer.session.phase.value).toBe('idle');
    expect(await press('n')).toEqual([]);
    expect(trainer.session.phase.value).toBe('running');
  });

  it('a key inside a prompt renders nothing, and the key that completes it renders the stream once', async () => {
    expect(await press('n')).toEqual([]);
    expect(await press('e')).toEqual([]);
    expect(await press('k')).toEqual([]);
    expect(trainer.session.promptResults.value).toHaveLength(0);
    // こ completes ねこ: the next prompt is on display and the stream draws the new window.
    expect(await press('o')).toEqual(['TextStream']);
    expect(trainer.session.promptResults.value).toHaveLength(1);
  });

  it('a rejected key, a hint, a wrong layout and its end render nothing', async () => {
    await press('n');
    expect(await press('x')).toEqual([]);
    expect(await press('x')).toEqual([]);
    expect(await press('Escape')).toEqual([]);
    // Cyrillic: the notice line gets text, nothing renders; the next Latin key takes it away.
    expect(await press('ф')).toEqual([]);
    expect(container.textContent).toContain('Switch your keyboard layout to English');
    expect(await press('e')).toEqual([]);
    expect(container.textContent).not.toContain('Switch your keyboard layout to English');
  });

  it('shows the hint through a text node, in the line kept for it', async () => {
    expect(container.textContent).not.toContain('Revealed');
    expect(await press('Escape')).toEqual([]);
    expect(container.textContent).toContain('Revealed: neko');
  });

  it('keeps the rule over 45 prompts, through every compact() of the matcher', async () => {
    const rendered: string[][] = [];
    for (let prompt = 0; prompt < 45; prompt++) {
      for (const key of 'neko') rendered.push(await press(key));
    }
    expect(trainer.session.promptResults.value).toHaveLength(45);

    rendered.forEach((components, i) => {
      // The fourth key of each prompt completes it.
      expect(components, `key ${i}`).toEqual(i % 4 === 3 ? ['TextStream'] : []);
    });
  });

  it('writes the stream to the DOM instead: classes, and the attributes tests read', async () => {
    const arena = container.querySelector('[data-testid="prompt-arena"]');
    expect(arena?.getAttribute('data-phase')).toBe('idle');
    expect(arena?.getAttribute('data-canonical')).toBe('neko');
    expect(arena?.getAttribute('data-rejected')).toBeNull();

    await press('n');
    await press('e');
    expect(arena?.getAttribute('data-phase')).toBe('running');
    // ね is typed: the first token has the typed class.
    expect(arena?.querySelector('[data-token="0"]')?.className).toBe('nk-char is-correct');
    expect(arena?.querySelector('[data-token="1"]')?.className).toBe('nk-char is-untyped');

    await press('x');
    expect(arena?.getAttribute('data-rejected')).toBe('true');
    expect(arena?.querySelector('[data-token="1"]')?.className).toBe('nk-char is-miss');
    await press('k');
    expect(arena?.getAttribute('data-rejected')).toBeNull();
  });

  it('hides the interface by one attribute on the document, not by rendering', async () => {
    expect(document.documentElement.hasAttribute('data-testing')).toBe(false);
    expect(await press('n')).toEqual([]);
    expect(document.documentElement.hasAttribute('data-testing')).toBe(true);

    trainer.restart();
    await settle();
    expect(document.documentElement.hasAttribute('data-testing')).toBe(false);
  });

  it('a mouse movement beyond a few pixels shows the interface until the next key', async () => {
    await press('n');
    const move = (x: number, y: number): void => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y }));
    };
    move(100, 100);
    move(104, 100);
    expect(document.documentElement.hasAttribute('data-testing')).toBe(true);
    move(120, 100);
    expect(document.documentElement.hasAttribute('data-testing')).toBe(false);

    await press('e');
    expect(document.documentElement.hasAttribute('data-testing')).toBe(true);
  });
});

describe('render isolation: a zen test', () => {
  const neko: PromptItem = { key: 'word:neko', text: 'ねこ' };

  let container: HTMLDivElement;
  let trainer: Trainer;
  let input: HTMLInputElement;
  let prevDiffed: ((vnode: VNode) => void) | undefined;

  beforeEach(async () => {
    setTestConfig({ kind: 'zen' });
    container = document.createElement('div');
    document.body.appendChild(container);
    trainer = createTrainer({ nextPrompt: () => neko });
    render(<TrainerPage trainer={trainer} />, container);
    await settle();
    const found = container.querySelector('input');
    if (found === null) throw new Error('no input field');
    input = found;
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
    document.documentElement.removeAttribute('data-testing');
    setTestConfig({ kind: 'time', seconds: 30 });
  });

  const finishButton = (): HTMLButtonElement | undefined =>
    Array.from(container.querySelectorAll('button')).find((b) => b.textContent.includes('Finish'));

  async function press(key: string): Promise<string[]> {
    const rendered: string[] = [];
    options.diffed = (vnode: VNode) => {
      if (typeof vnode.type === 'function' && vnode.type !== Fragment) {
        rendered.push(vnode.type.name);
      }
      if (prevDiffed) prevDiffed(vnode);
    };
    input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    await tick();
    if (prevDiffed) {
      options.diffed = prevDiffed;
    } else {
      delete options.diffed;
    }
    return rendered;
  }

  it('shows a Finish button with its shortcut, disabled until the test starts, and a counter of prompts', () => {
    const button = finishButton();
    expect(button?.disabled).toBe(true);
    expect(button?.textContent).toContain('ctrl + enter');
    expect(container.querySelector('[data-testid="live-counter"]')?.textContent).toBe('0');
  });

  it('the first key enables Finish without rendering anything, and the rule still holds', async () => {
    expect(await press('n')).toEqual([]);
    expect(finishButton()?.disabled).toBe(false);
    expect(await press('e')).toEqual([]);
    expect(await press('k')).toEqual([]);
    expect(await press('o')).toEqual(['TextStream']);
    // The counter follows the completed prompts, as a text node.
    expect(container.querySelector('[data-testid="live-counter"]')?.textContent).toBe('1');
  });

  it('Ctrl+Enter ends the test and the page shows the results', async () => {
    await press('n');
    await press('e');
    await press('k');
    await press('o');
    input.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );
    await settle();
    expect(trainer.session.phase.value).toBe('finished');
    expect(container.querySelector('[data-testid="results-panel"]')).not.toBeNull();
  });

  it('the Finish button ends the test too', async () => {
    await press('n');
    await press('e');
    await press('k');
    await press('o');
    finishButton()?.click();
    await settle();
    expect(trainer.session.phase.value).toBe('finished');
    expect(container.querySelector('[data-testid="results-panel"]')).not.toBeNull();
  });
});
