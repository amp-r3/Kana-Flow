import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { allKanaRows } from './data';
import { wordsData } from './data/words';
import { phrasesData } from './data/phrases';
import { compile, canonical } from '../lib/engine';
import type { PromptItem } from './types';

describe('data integrity: content items', () => {
  it('content ids unique', () => {
    const allContent = [...wordsData, ...phrasesData];
    const idSet = new Set<string>();
    for (const item of allContent) {
      expect(idSet.has(item.id)).toBe(false);
      idSet.add(item.id);
    }
  });

  it('every content item has non-empty en and ru', () => {
    const allContent = [...wordsData, ...phrasesData];
    for (const item of allContent) {
      expect(item.meaning.en.trim().length).toBeGreaterThan(0);
      expect(item.meaning.ru.trim().length).toBeGreaterThan(0);
    }
  });

  it('content pools per script x kind: every pool has >= 3 items', () => {
    const hiraganaWords = wordsData.filter((w) => w.script === 'hiragana');
    const katakanaWords = wordsData.filter((w) => w.script === 'katakana');
    const hiraganaPhrases = phrasesData.filter((p) => p.script === 'hiragana');
    const katakanaPhrases = phrasesData.filter((p) => p.script === 'katakana');

    expect(hiraganaWords.length).toBeGreaterThanOrEqual(3);
    expect(katakanaWords.length).toBeGreaterThanOrEqual(3);
    expect(hiraganaPhrases.length).toBeGreaterThanOrEqual(3);
    expect(katakanaPhrases.length).toBeGreaterThanOrEqual(3);
  });

  it('all words/phrases compile in both strictness modes', () => {
    const allContent = [...wordsData, ...phrasesData];
    for (const item of allContent) {
      const prompt: PromptItem = {
        key: item.id,
        text: item.text,
        ...(item.readingHints ? { readingHints: item.readingHints } : {}),
      };
      const compiledLearner = compile([prompt], 'learner');
      expect(compiledLearner.tokens.length).toBeGreaterThan(0);
      expect(canonical(compiledLearner, 0).length).toBeGreaterThan(0);

      const compiledIme = compile([prompt], 'ime');
      expect(compiledIme.tokens.length).toBeGreaterThan(0);
      expect(canonical(compiledIme, 0).length).toBeGreaterThan(0);
    }
  });
});

describe('data integrity: font glyphs sync', () => {
  it('glyphs.txt in sync with the data', () => {
    const glyphsPath = join(process.cwd(), 'glyphs.txt');
    expect(existsSync(glyphsPath)).toBe(true);
    const committedGlyphs = readFileSync(glyphsPath, 'utf-8');

    const expectedSet = new Set<string>();
    const mandatoryChars = 'ーっッゃゅょャュョァィゥェォ、。・０１２３４５６７８９';
    for (const ch of mandatoryChars) expectedSet.add(ch);

    for (const row of allKanaRows) {
      for (const entry of row.entries) {
        if (entry.hiragana) {
          for (const ch of entry.hiragana) expectedSet.add(ch);
        }
        for (const ch of entry.katakana) expectedSet.add(ch);
      }
    }

    for (const w of wordsData) {
      for (const ch of w.text) expectedSet.add(ch);
    }

    for (const p of phrasesData) {
      for (const ch of p.text) expectedSet.add(ch);
    }

    const expectedSorted = Array.from(expectedSet).sort().join('');
    expect(committedGlyphs).toBe(expectedSorted);
  });
});
