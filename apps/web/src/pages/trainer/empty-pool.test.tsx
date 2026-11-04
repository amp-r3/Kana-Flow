// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render } from 'preact';
import { TrainerPage } from './ui/trainer-page';
import { setScript, selectAllRows, presetBasic, setContent } from '@/entities/settings';
import { resetSession } from '@/entities/session';
import { t } from '@/shared/i18n';

describe('D20: rows with no kana for the script do not crash the trainer', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    resetSession();
    setContent('single');
    setScript('katakana');
    selectAllRows(['ext_fa']);
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    render(null, container);
    container.remove();
    setScript('both');
    presetBasic();
  });

  it('switching to hiragana with only extended rows shows a notice and basic hiragana', async () => {
    render(<TrainerPage />, container);
    await new Promise((resolve) => setTimeout(resolve, 20));

    // katakana + ext rows: nothing to explain
    expect(container.textContent).not.toContain(t('stage.noKanaForRows'));

    // This switch used to leave pickPrompt with an empty pool and throw.
    setScript('hiragana');
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(container.textContent).toContain(t('stage.noKanaForRows'));
    const glyph = container.querySelector('[data-testid="prompt-text"]')?.textContent ?? '';
    expect(glyph).toMatch(/^[぀-ゟ]+$/);
  });

  it('starting from an unusable combination (as restored from storage) does not crash', async () => {
    setScript('hiragana');
    render(<TrainerPage />, container);
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(container.textContent).toContain(t('stage.noKanaForRows'));
    expect(container.querySelector('[data-testid="prompt-text"]')?.textContent).toMatch(
      /^[぀-ゟ]+$/,
    );
  });
});
