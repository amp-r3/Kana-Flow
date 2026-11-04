import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTrainer } from './trainer';
import * as promptModule from '@/entities/prompt';
import type { ContentItem, PromptItem } from '@/entities/prompt';
import {
  contentSetting,
  initSettings,
  presetBasic,
  selectAllRows,
  setContent,
  setScript,
  strictnessSetting,
} from '@/entities/settings';
import { MemoryKeyValueStore } from '@/shared/lib';

const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

const word: ContentItem = {
  id: 'word:neko',
  text: 'ねこ',
  script: 'hiragana',
  meaning: { en: 'cat', ru: 'кошка' },
};

describe('trainer: prompt source, restarts and content loading', () => {
  beforeEach(() => {
    initSettings(new MemoryKeyValueStore());
    setContent('single');
    setScript('both');
    presetBasic();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('start() shows a first prompt and stop() ends the following of the settings', () => {
    const picked: PromptItem = { key: 'basic:a', text: 'あ' };
    const next = vi.fn(() => picked);
    const trainer = createTrainer({ nextPrompt: next });
    expect(trainer.session.currentPrompt.value).toBeNull();

    const stop = trainer.start();
    expect(trainer.session.currentPrompt.value?.text).toBe('あ');
    const afterStart = next.mock.calls.length;

    setScript('katakana');
    expect(next.mock.calls.length).toBeGreaterThan(afterStart);

    stop();
    const afterStop = next.mock.calls.length;
    setScript('hiragana');
    expect(next.mock.calls.length).toBe(afterStop);
  });

  it('restart() discards a running test and loads a fresh prompt', () => {
    const picked: PromptItem = { key: 'word:neko', text: 'ねこ' };
    const trainer = createTrainer({ nextPrompt: () => picked });
    const stop = trainer.start();
    trainer.session.handleIntent({ kind: 'char', char: 'n' });
    expect(trainer.session.phase.value).toBe('running');

    trainer.restart();
    expect(trainer.session.phase.value).toBe('idle');
    expect(trainer.session.romajiBuffer.value).toBe('');
    expect(trainer.session.currentPrompt.value?.text).toBe('ねこ');
    stop();
  });

  it('the default source draws from the pool of the selected settings', () => {
    setScript('katakana');
    const trainer = createTrainer({ rng: { next: () => 0 } });
    const stop = trainer.start();
    expect(trainer.session.currentPrompt.value?.script).toBe('katakana');
    stop();
  });

  it('loads vocabulary once when the content becomes words, and restarts with it', async () => {
    const load = vi.spyOn(promptModule, 'loadContent').mockResolvedValue([word]);
    setScript('hiragana');
    const trainer = createTrainer({ rng: { next: () => 0 } });
    const stop = trainer.start();
    expect(load).not.toHaveBeenCalled();

    setContent('words');
    expect(trainer.isLoadingContent.value).toBe(true);
    await flush();

    expect(load).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledWith('words');
    expect(trainer.isLoadingContent.value).toBe(false);
    expect(trainer.contentLoadFailed.value).toBe(false);
    expect(trainer.session.currentPrompt.value?.text).toBe('ねこ');

    // Back and forth does not fetch again.
    setContent('single');
    setContent('words');
    await flush();
    expect(load).toHaveBeenCalledTimes(1);
    stop();
  });

  it('a failed load reports it and falls back to single kana', async () => {
    vi.spyOn(promptModule, 'loadContent').mockRejectedValue(new Error('chunk failed'));
    const trainer = createTrainer({ rng: { next: () => 0 } });
    const stop = trainer.start();

    setContent('phrases');
    await flush();

    expect(trainer.contentLoadFailed.value).toBe(true);
    expect(trainer.isLoadingContent.value).toBe(false);
    expect(contentSetting.value).toBe('single');
    stop();
  });

  it('a load that finishes after stop() does not touch the session', async () => {
    let resolve: (items: readonly ContentItem[]) => void = () => {};
    vi.spyOn(promptModule, 'loadContent').mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const next = vi.fn((): PromptItem => ({ key: 'basic:a', text: 'あ' }));
    const trainer = createTrainer({ nextPrompt: next });
    const stop = trainer.start();
    setContent('words');
    stop();
    const calls = next.mock.calls.length;

    resolve([word]);
    await flush();
    expect(next.mock.calls.length).toBe(calls);
  });

  it('noKanaForRows is true only for single kana whose rows give nothing for the script (D20)', () => {
    const trainer = createTrainer({ nextPrompt: () => ({ key: 'basic:a', text: 'あ' }) });
    expect(trainer.noKanaForRows.value).toBe(false);

    selectAllRows(['ext_fa']);
    setScript('katakana');
    expect(trainer.noKanaForRows.value).toBe(false);
    setScript('hiragana');
    expect(trainer.noKanaForRows.value).toBe(true);
    setContent('words');
    expect(trainer.noKanaForRows.value).toBe(false);
  });

  it('restart loads the prompt with the strictness of the settings', () => {
    const trainer = createTrainer({ nextPrompt: () => ({ key: 'word:pan', text: 'パン' }) });
    expect(strictnessSetting.value).toBe('learner');
    trainer.restart();
    expect(trainer.session.currentPrompt.value?.text).toBe('パン');
  });
});
