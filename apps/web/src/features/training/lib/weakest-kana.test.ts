import { describe, it, expect } from 'vitest';
import type { PromptResult } from '../model/types';
import { weakestKana } from './weakest-kana';

function prompt(outcomes: readonly { kanaKey: string | null; mistakes: number }[]): PromptResult {
  return {
    key: 'p',
    startedAt: 0,
    endedAt: 1,
    mistakes: 0,
    assisted: false,
    tokenOutcomes: outcomes.map((o) => ({ ...o, ms: 100 })),
  };
}

describe('weakestKana', () => {
  it('is empty when nothing was mistyped', () => {
    expect(weakestKana([prompt([{ kanaKey: 'hiragana:あ', mistakes: 0 }])])).toEqual([]);
  });

  it('sums mistakes per kana across prompts and sorts the worst first', () => {
    const items = weakestKana([
      prompt([
        { kanaKey: 'hiragana:あ', mistakes: 1 },
        { kanaKey: 'hiragana:か', mistakes: 3 },
      ]),
      prompt([{ kanaKey: 'hiragana:あ', mistakes: 1 }]),
    ]);
    expect(items.map((i) => [i.glyph, i.mistakes])).toEqual([
      ['か', 3],
      ['あ', 2],
    ]);
    expect(items[0]?.romaji).toBe('ka');
  });

  it('ignores tokens without a kana key', () => {
    expect(weakestKana([prompt([{ kanaKey: null, mistakes: 4 }])])).toEqual([]);
  });

  it('keeps at most five kana', () => {
    const keys = ['あ', 'い', 'う', 'え', 'お', 'か'].map((g) => ({
      kanaKey: `hiragana:${g}`,
      mistakes: 1,
    }));
    expect(weakestKana([prompt(keys)])).toHaveLength(5);
  });
});
