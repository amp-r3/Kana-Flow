// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from 'preact';
import { TrainerPage } from './ui/trainer-page';
import {
  buildPool,
  getPracticeSettings,
  loadContent,
  setContent,
  setScript,
  setWeakFocus,
} from '@/entities/kana';
import { resetSession } from '@/entities/session';
import { initProgress, resetProgress } from '@/entities/progress';
import { MemoryKeyValueStore, STORAGE_KEYS } from '@/shared/lib';
import { createPromptWeights } from '@/features/type-prompt';

const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 30));

describe('D20: weak kana steer which word the trainer picks', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    resetSession();
    setScript('katakana');
    setWeakFocus(true);
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    render(null, container);
    container.remove();
    vi.restoreAllMocks();
    resetProgress();
    setContent('single');
    setScript('both');
  });

  it('the first word shown is the one the kana weights select, not the one a flat pool would', async () => {
    const words = await loadContent('words');
    setContent('words');
    const pool = buildPool(getPracticeSettings(), words);
    const weakWord = pool[0];
    if (weakWord === undefined) throw new Error('katakana word pool is empty');

    // Only the first word's kana are weak; everything else in the pool is well known.
    const stats: Record<string, { a: number; m: number; t: number }> = {};
    for (const item of pool) {
      for (const ch of item.text) {
        stats[`katakana:${ch}`] = weakWord.text.includes(ch)
          ? { a: 20, m: 20, t: 300 }
          : { a: 50, m: 0, t: 300 };
      }
    }
    const store = new MemoryKeyValueStore();
    store.set(STORAGE_KEYS.PROGRESS, JSON.stringify({ v: 1, stats }));
    initProgress(store);

    // A roll inside the weak word's share of the weighted pool, but beyond the first
    // item of a flat pool: only weights applied to words can make this pick the weak word.
    const weights = createPromptWeights()(pool, new Map(Object.entries(stats)));
    let total = 0;
    for (const item of pool) total += weights.get(item.key) ?? 1;
    const share = (weights.get(weakWord.key) ?? 0) / total;
    const roll = share * 0.9;
    expect(roll * pool.length).toBeGreaterThan(1);
    vi.spyOn(Math, 'random').mockReturnValue(roll);

    render(<TrainerPage />, container);
    await settle();

    const shown = container.querySelector('.font-kana')?.textContent ?? '';
    expect(shown).toBe(weakWord.text);
  });
});
