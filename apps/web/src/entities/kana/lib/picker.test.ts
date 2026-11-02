import { describe, it, expect } from 'vitest';
import { buildPool, pickPrompt, rowsYieldKana } from './picker';
import type { PracticeSettings, PromptItem, ContentItem } from '../model/types';
import type { Rng } from '@/shared/lib';

class SeededRng implements Rng {
  private state: number;
  constructor(seed = 12345) {
    this.state = seed;
  }
  next(): number {
    this.state = (this.state * 1664525 + 1013904223) % 4294967296;
    return this.state / 4294967296;
  }
}

describe('picker: pool building', () => {
  it('builds single kana pool for basic rows in both scripts', () => {
    const settings: PracticeSettings = {
      script: 'both',
      content: 'single',
      strictness: 'learner',
      rowIds: ['vowels'],
      weakFocus: false,
    };
    const pool = buildPool(settings);
    // 5 vowels x 2 scripts = 10 prompts
    expect(pool.length).toBe(10);
    expect(pool.some((p) => p.key === 'hiragana:あ')).toBe(true);
    expect(pool.some((p) => p.key === 'katakana:ア')).toBe(true);
  });

  it('excludes extended rows when script is hiragana-only', () => {
    const settings: PracticeSettings = {
      script: 'hiragana',
      content: 'single',
      strictness: 'learner',
      rowIds: ['vowels', 'ext_fa'],
      weakFocus: false,
    };
    const pool = buildPool(settings);
    // vowels has 5 hiragana, ext_fa has 0 hiragana
    expect(pool.length).toBe(5);
    expect(pool.some((p) => p.text === 'ファ')).toBe(false);
  });

  it('includes extended rows when script is katakana or both', () => {
    const settings: PracticeSettings = {
      script: 'katakana',
      content: 'single',
      strictness: 'learner',
      rowIds: ['ext_fa'],
      weakFocus: false,
    };
    const pool = buildPool(settings);
    expect(pool.length).toBe(4);
    expect(pool.some((p) => p.text === 'ファ')).toBe(true);
  });

  it('filters content by script in words mode', () => {
    const sampleWords: readonly ContentItem[] = [
      {
        id: 'word:neko',
        text: 'ねこ',
        script: 'hiragana',
        meaning: { en: 'Cat', ru: 'Кот' },
      },
      {
        id: 'word:pan',
        text: 'パン',
        script: 'katakana',
        meaning: { en: 'Bread', ru: 'Хлеб' },
      },
    ];

    const hSettings: PracticeSettings = {
      script: 'hiragana',
      content: 'words',
      strictness: 'learner',
      rowIds: ['vowels'],
      weakFocus: false,
    };
    const hPool = buildPool(hSettings, sampleWords);
    expect(hPool.length).toBe(1);
    expect(hPool[0]?.key).toBe('word:neko');

    const bothSettings: PracticeSettings = {
      script: 'both',
      content: 'words',
      strictness: 'learner',
      rowIds: ['vowels'],
      weakFocus: false,
    };
    const bothPool = buildPool(bothSettings, sampleWords);
    expect(bothPool.length).toBe(2);
  });

  it('falls back to single-kana pool when content is empty or has no script matches (plan 5.5)', () => {
    const settings: PracticeSettings = {
      script: 'hiragana',
      content: 'words',
      strictness: 'learner',
      rowIds: ['vowels'],
      weakFocus: false,
    };
    // Pass empty content array
    const fallbackPool = buildPool(settings, []);
    // Falls back to single kana vowels (5 hiragana items)
    expect(fallbackPool.length).toBe(5);
    expect(fallbackPool[0]?.key).toBe('hiragana:あ');

    // Content with no items matching script
    const katakanaOnlyWords: readonly ContentItem[] = [
      {
        id: 'word:pan',
        text: 'パン',
        script: 'katakana',
        meaning: { en: 'Bread', ru: 'Хлеб' },
      },
    ];
    const fallbackPool2 = buildPool(settings, katakanaOnlyWords);
    expect(fallbackPool2.length).toBe(5);
    expect(fallbackPool2[0]?.key).toBe('hiragana:あ');
  });
});

describe('picker: prompt selection', () => {
  it('never returns the same item twice in a row when pool > 1', () => {
    const pool: PromptItem[] = [
      { key: 'a', text: 'あ' },
      { key: 'i', text: 'い' },
      { key: 'u', text: 'う' },
    ];
    const rng = new SeededRng(42);
    const weights = new Map<string, number>();

    let prevKey: string | null = null;
    for (let step = 0; step < 50; step++) {
      const picked = pickPrompt(pool, weights, rng, prevKey);
      expect(picked.key).not.toBe(prevKey);
      prevKey = picked.key;
    }
  });

  it('weights distribution towards higher-weighted items', () => {
    const pool: PromptItem[] = [
      { key: 'rare', text: 'あ' },
      { key: 'frequent', text: 'い' },
    ];
    const weights = new Map<string, number>([
      ['rare', 1],
      ['frequent', 9],
    ]);
    const rng = new SeededRng(100);

    const counts = { rare: 0, frequent: 0 };
    let prevKey: string | null = null;

    for (let i = 0; i < 200; i++) {
      const picked = pickPrompt(pool, weights, rng, prevKey);
      if (picked.key === 'rare') counts.rare++;
      if (picked.key === 'frequent') counts.frequent++;
      prevKey = picked.key;
    }

    // Since it cannot repeat immediately with length 2, it alternates.
    // Let's test with pool length 3 to see weighting effect
    const pool3: PromptItem[] = [
      { key: 'w1', text: 'あ' },
      { key: 'w2', text: 'い' },
      { key: 'w10', text: 'う' },
    ];
    const weights3 = new Map<string, number>([
      ['w1', 1],
      ['w2', 1],
      ['w10', 10],
    ]);
    const counts3 = { w1: 0, w2: 0, w10: 0 };
    prevKey = null;

    for (let i = 0; i < 300; i++) {
      const picked = pickPrompt(pool3, weights3, rng, prevKey);
      if (picked.key === 'w1') counts3.w1++;
      if (picked.key === 'w2') counts3.w2++;
      if (picked.key === 'w10') counts3.w10++;
      prevKey = picked.key;
    }

    expect(counts3.w10).toBeGreaterThan(counts3.w1);
    expect(counts3.w10).toBeGreaterThan(counts3.w2);
  });

  describe('D20: rows that give no kana for the script', () => {
    const base: PracticeSettings = {
      script: 'hiragana',
      content: 'single',
      strictness: 'learner',
      rowIds: ['ext_fa'],
      weakFocus: false,
    };

    it('buildPool falls back to the basic rows instead of returning an empty pool', () => {
      const pool = buildPool(base);
      expect(pool.length).toBe(46);
      expect(pool.every((item) => item.script === 'hiragana')).toBe(true);
      // The fallback pool is usable: pickPrompt must not throw on it.
      expect(() => pickPrompt(pool, new Map(), new SeededRng(1), null)).not.toThrow();
    });

    it('rowsYieldKana tells apart rows with and without kana for the script', () => {
      expect(rowsYieldKana(base)).toBe(false);
      expect(rowsYieldKana({ ...base, script: 'katakana' })).toBe(true);
      expect(rowsYieldKana({ ...base, script: 'both' })).toBe(true);
      expect(rowsYieldKana({ ...base, rowIds: ['ext_fa', 'k'] })).toBe(true);
    });

    it('a selection that does yield kana is used as is', () => {
      const pool = buildPool({ ...base, rowIds: ['vowels'] });
      expect(pool.map((item) => item.text)).toEqual(['あ', 'い', 'う', 'え', 'お']);
    });
  });
});
