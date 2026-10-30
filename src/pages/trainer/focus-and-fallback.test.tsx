// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from 'preact';
import { TrainerPage } from './ui/trainer-page';
import { TypingController } from '@/features/type-prompt';
import { defaultClock, defaultScheduler } from '@/shared/lib';
import type { PromptItem } from '@/entities/kana';
import * as kanaModule from '@/entities/kana';
import { contentSetting, setContent } from '@/entities/kana';
import { resetSession } from '@/entities/session';
import { t } from '@/shared/i18n';

describe('trainer UI: focus redirection and content loader error fallback', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    resetSession();
    setContent('single');
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    render(null, container);
    container.remove();
  });

  it('letter key pressed while a button has focus moves focus to input and is processed (Plan 6.2)', async () => {
    const prompt: PromptItem = { key: 'basic:ka', text: 'か' };
    const controller = new TypingController(() => prompt, defaultClock, defaultScheduler);

    render(<TrainerPage controller={controller} />, container);
    controller.loadPrompt(prompt, 'learner');

    // Wait for Preact effects to attach event listeners
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Find the input and a button (e.g. rows button or restart button)
    const input = container.querySelector('input');
    const button = container.querySelector('button');
    expect(input).not.toBeNull();
    expect(button).not.toBeNull();

    if (!input || !button) return;

    // Focus the button
    button.focus();
    expect(document.activeElement).toBe(button);

    const firstChar = controller.canonicalRomaji.value.slice(0, 1) || 'a';

    // Press firstChar on the button
    const event = new KeyboardEvent('keydown', { key: firstChar, bubbles: true });
    button.dispatchEvent(event);

    // Focus must move to input
    expect(document.activeElement).toBe(input);
    // Buffer must have processed firstChar
    expect(controller.typedBuffer.value).toBe(firstChar);

    // Focus button again and press 'Escape'
    button.focus();
    expect(document.activeElement).toBe(button);

    const escEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    button.dispatchEvent(escEvent);

    // Focus must return to input without activating reveal
    expect(document.activeElement).toBe(input);
    expect(controller.isAssisted.value).toBe(false);
  });

  it('loadContent failure falls back to single-kana mode with an i18n message', async () => {
    // Spy on loadContent and make it reject (simulating failed dynamic import chunk)
    const loadContentSpy = vi.spyOn(kanaModule, 'loadContent').mockRejectedValue(
      new Error('Failed to fetch dynamically imported module'),
    );

    const prompt: PromptItem = { key: 'basic:a', text: 'あ' };
    const controller = new TypingController(() => prompt, defaultClock, defaultScheduler);

    render(<TrainerPage controller={controller} />, container);

    // Switch content to 'words'
    setContent('words');

    // Wait for the promise rejection and fallback to resolve
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(loadContentSpy).toHaveBeenCalledWith('words');
    // Must fall back to 'single'
    expect(contentSetting.value).toBe('single');

    // Must show the i18n error notice
    const expectedMessage = t('stage.contentLoadError');
    expect(container.textContent).toContain(expectedMessage);
  });
});
