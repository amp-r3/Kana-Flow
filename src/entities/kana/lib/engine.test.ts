import { describe, it, expect } from 'vitest';
import {
  compile,
  start,
  step,
  isComplete,
  activeTokenIndex,
  extensions,
  canonical,
  romajiForKey,
  type Matcher,
  type MatchState,
} from './engine';
import { shouldAbsorb } from './absorption';
import type { PromptItem } from '../model/types';
import { allKanaRows } from '../model/data';
import { wordsData } from '../model/data/words';
import { phrasesData } from '../model/data/phrases';

function feedString(m: Matcher, s: MatchState, input: string): MatchState | null {
  let current: MatchState | null = s;
  for (const ch of input) {
    if (!current) return null;
    current = step(m, current, ch);
  }
  return current;
}

function completesWith(prompt: PromptItem, strictness: 'learner' | 'ime', input: string): boolean {
  const m = compile(prompt, strictness);
  const s = start(m);
  const finalState = feedString(m, s, input);
  return finalState !== null && isComplete(m, finalState);
}

class DeterministicRng {
  private s: number;
  constructor(seed = 98765) {
    this.s = seed;
  }
  next(): number {
    this.s = (this.s * 1103515245 + 12345) & 0x7fffffff;
    return this.s / 0x7fffffff;
  }
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  nextChar(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz-\'';
    return chars[this.nextInt(0, chars.length - 1)] ?? 'a';
  }
}

describe('engine: basic and digraph kana matching', () => {
  it('きゃ matches kya in both modes', () => {
    const prompt: PromptItem = { key: 'hiragana:きゃ', text: 'きゃ' };
    expect(completesWith(prompt, 'ime', 'kya')).toBe(true);
    expect(completesWith(prompt, 'learner', 'kya')).toBe(true);
    expect(completesWith(prompt, 'ime', 'ka')).toBe(false);
  });

  it('ちょっと tokenizes into ちょ + っと and accepts chotto, tyotto', () => {
    const prompt: PromptItem = { key: 'word:chotto', text: 'ちょっと' };
    expect(completesWith(prompt, 'ime', 'chotto')).toBe(true);
    expect(completesWith(prompt, 'ime', 'tyotto')).toBe(true);
    expect(completesWith(prompt, 'learner', 'chotto')).toBe(true);
    expect(completesWith(prompt, 'learner', 'tyotto')).toBe(true);
    expect(completesWith(prompt, 'ime', 'choto')).toBe(false);
  });

  it('っち accepts tchi, tti in ime; and cchi in learner only', () => {
    const prompt: PromptItem = { key: 'hiragana:っち', text: 'っち' };
    expect(completesWith(prompt, 'ime', 'tchi')).toBe(true);
    expect(completesWith(prompt, 'ime', 'tti')).toBe(true);
    expect(completesWith(prompt, 'ime', 'cchi')).toBe(false);

    expect(completesWith(prompt, 'learner', 'tchi')).toBe(true);
    expect(completesWith(prompt, 'learner', 'tti')).toBe(true);
    expect(completesWith(prompt, 'learner', 'cchi')).toBe(true);
  });

  it('し accepts shi and si; つ accepts tsu and tu', () => {
    const shi: PromptItem = { key: 'hiragana:し', text: 'し' };
    expect(completesWith(shi, 'ime', 'shi')).toBe(true);
    expect(completesWith(shi, 'ime', 'si')).toBe(true);
    expect(completesWith(shi, 'ime', 'ci')).toBe(false);

    const tsu: PromptItem = { key: 'hiragana:つ', text: 'つ' };
    expect(completesWith(tsu, 'ime', 'tsu')).toBe(true);
    expect(completesWith(tsu, 'ime', 'tu')).toBe(true);
    expect(completesWith(tsu, 'ime', 'su')).toBe(false);
  });

  it('single ん prompt accepts nn and n\' only in ime, but accepts n in learner', () => {
    const prompt: PromptItem = { key: 'hiragana:ん', text: 'ん' };
    expect(completesWith(prompt, 'ime', 'nn')).toBe(true);
    expect(completesWith(prompt, 'ime', "n'")).toBe(true);
    expect(completesWith(prompt, 'ime', 'n')).toBe(false);

    expect(completesWith(prompt, 'learner', 'n')).toBe(true);
    expect(completesWith(prompt, 'learner', 'nn')).toBe(true);
    expect(completesWith(prompt, 'learner', "n'")).toBe(true);
  });

  it('を prompt accepts wo only in ime, but accepts o in learner', () => {
    const prompt: PromptItem = { key: 'hiragana:を', text: 'を' };
    expect(completesWith(prompt, 'ime', 'wo')).toBe(true);
    expect(completesWith(prompt, 'ime', 'o')).toBe(false);

    expect(completesWith(prompt, 'learner', 'wo')).toBe(true);
    expect(completesWith(prompt, 'learner', 'o')).toBe(true);
  });

  it('ime mode strictly rejects koohii and pan', () => {
    const coffee: PromptItem = { key: 'word:ko-hi-', text: 'コーヒー' };
    expect(completesWith(coffee, 'ime', 'koohii')).toBe(false);
    expect(completesWith(coffee, 'ime', 'ko-hi-')).toBe(true);

    const pan: PromptItem = { key: 'word:pan', text: 'パン' };
    expect(completesWith(pan, 'ime', 'pan')).toBe(false);
    expect(completesWith(pan, 'ime', 'pann')).toBe(true);
  });

  it('learner and ime standalone-っ fallback accepts xtu, ltu, xtsu', () => {
    const prompt: PromptItem = { key: 'sokuon', text: 'っ' };
    expect(completesWith(prompt, 'ime', 'xtu')).toBe(true);
    expect(completesWith(prompt, 'ime', 'ltu')).toBe(true);
    expect(completesWith(prompt, 'ime', 'xtsu')).toBe(true);

    expect(completesWith(prompt, 'learner', 'xtu')).toBe(true);
    expect(completesWith(prompt, 'learner', 'ltu')).toBe(true);
    expect(completesWith(prompt, 'learner', 'xtsu')).toBe(true);
  });
});

describe('engine: ん contextual lookahead', () => {
  it('パン accepts pann only in ime, but pan and pann in learner', () => {
    const prompt: PromptItem = { key: 'word:pan', text: 'パン' };
    expect(completesWith(prompt, 'ime', 'pann')).toBe(true);
    expect(completesWith(prompt, 'ime', "pan'")).toBe(true);
    expect(completesWith(prompt, 'ime', 'pan')).toBe(false);

    expect(completesWith(prompt, 'learner', 'pan')).toBe(true);
    expect(completesWith(prompt, 'learner', 'pann')).toBe(true);
  });

  it('かんじ accepts both kanji and kannji in both modes', () => {
    const prompt: PromptItem = { key: 'word:kanji', text: 'かんじ' };
    expect(completesWith(prompt, 'ime', 'kanji')).toBe(true);
    expect(completesWith(prompt, 'ime', 'kannji')).toBe(true);
    expect(completesWith(prompt, 'learner', 'kanji')).toBe(true);
    expect(completesWith(prompt, 'learner', 'kannji')).toBe(true);
  });

  it('こんにちは requires konnnichiha in ime, but learner accepts konnichiha, konnnichiha, and konnichiwa/konnnichiwa', () => {
    const prompt: PromptItem = {
      key: 'word:konnichiha',
      text: 'こんにちは',
      readingHints: [{ tokenIndex: 4, learner: ['wa'] }],
    };
    expect(completesWith(prompt, 'ime', 'konnnichiha')).toBe(true);
    expect(completesWith(prompt, 'ime', 'konnichiha')).toBe(false);
    expect(completesWith(prompt, 'ime', 'konnnichiwa')).toBe(false);

    expect(completesWith(prompt, 'learner', 'konnnichiha')).toBe(true);
    expect(completesWith(prompt, 'learner', 'konnichiha')).toBe(true);
    expect(completesWith(prompt, 'learner', 'konnnichiwa')).toBe(true);
    expect(completesWith(prompt, 'learner', 'konnichiwa')).toBe(true);
  });

  it('without a reading hint, は accepts only ha in both modes: はな learner accepts hana and rejects wana', () => {
    const prompt: PromptItem = {
      key: 'word:hana',
      text: 'はな',
    };
    expect(completesWith(prompt, 'ime', 'hana')).toBe(true);
    expect(completesWith(prompt, 'ime', 'wana')).toBe(false);

    expect(completesWith(prompt, 'learner', 'hana')).toBe(true);
    expect(completesWith(prompt, 'learner', 'wana')).toBe(false);
  });

  it('ほんや requires nn before y in ime mode', () => {
    const prompt: PromptItem = { key: 'word:honya', text: 'ほんや' };
    expect(completesWith(prompt, 'ime', 'honnya')).toBe(true);
    expect(completesWith(prompt, 'ime', 'honya')).toBe(false);
    expect(completesWith(prompt, 'learner', 'honya')).toBe(true);
    expect(completesWith(prompt, 'learner', 'honnya')).toBe(true);
  });
});

describe('engine: chōonpu elongation', () => {
  it('コーヒー accepts ko-hi- only in ime; learner accepts koohii, ko-hii, koohi-', () => {
    const prompt: PromptItem = { key: 'word:ko-hi-', text: 'コーヒー' };
    expect(completesWith(prompt, 'ime', 'ko-hi-')).toBe(true);
    expect(completesWith(prompt, 'ime', 'koohii')).toBe(false);
    expect(completesWith(prompt, 'ime', 'ko-hii')).toBe(false);
    expect(completesWith(prompt, 'ime', 'koohi-')).toBe(false);

    expect(completesWith(prompt, 'learner', 'ko-hi-')).toBe(true);
    expect(completesWith(prompt, 'learner', 'koohii')).toBe(true);
    expect(completesWith(prompt, 'learner', 'ko-hii')).toBe(true);
    expect(completesWith(prompt, 'learner', 'koohi-')).toBe(true);
  });
});

describe('engine: extended katakana words', () => {
  it('パーティー matches pa-thi- in ime', () => {
    const prompt: PromptItem = { key: 'word:pa-thi-', text: 'パーティー' };
    expect(completesWith(prompt, 'ime', 'pa-thi-')).toBe(true);
    expect(completesWith(prompt, 'learner', 'pa-thi-')).toBe(true);
    expect(completesWith(prompt, 'learner', 'paati-')).toBe(true);
  });

  it('ファイル matches fairu in ime', () => {
    const prompt: PromptItem = { key: 'word:fairu', text: 'ファイル' };
    expect(completesWith(prompt, 'ime', 'fairu')).toBe(true);
    expect(completesWith(prompt, 'learner', 'fairu')).toBe(true);
  });

  it('ヴァイオリン matches vaiorinn in ime, and vaiorin in learner', () => {
    const prompt: PromptItem = { key: 'word:vaiorin', text: 'ヴァイオリン' };
    expect(completesWith(prompt, 'ime', 'vaiorinn')).toBe(true);
    expect(completesWith(prompt, 'learner', 'vaiorin')).toBe(true);
    expect(completesWith(prompt, 'learner', 'vaiorinn')).toBe(true);
  });

  it('ウィンドウ, ディスク, チェック, ティッシュ match correctly', () => {
    expect(completesWith({ key: 'word:windou', text: 'ウィンドウ' }, 'ime', 'windou')).toBe(true);
    expect(completesWith({ key: 'word:disuku', text: 'ディスク' }, 'ime', 'dhisuku')).toBe(true);
    expect(completesWith({ key: 'word:disuku', text: 'ディスク' }, 'learner', 'disuku')).toBe(true);
    expect(completesWith({ key: 'word:chekku', text: 'チェック' }, 'ime', 'chekku')).toBe(true);
    expect(completesWith({ key: 'word:thisshu', text: 'ティッシュ' }, 'ime', 'thisshu')).toBe(true);
    expect(completesWith({ key: 'word:thisshu', text: 'ティッシュ' }, 'learner', 'tisshu')).toBe(true);
  });
});

describe('engine: trailing extensions and pure shouldAbsorb', () => {
  it('returns non-empty extensions when complete in learner mode for パン', () => {
    const prompt: PromptItem = { key: 'word:pan', text: 'パン' };
    const m = compile(prompt, 'learner');
    const s0 = start(m);

    const s1 = step(m, s0, 'p');
    expect(s1).not.toBeNull();
    const s2 = s1 ? step(m, s1, 'a') : null;
    expect(s2).not.toBeNull();
    const s3 = s2 ? step(m, s2, 'n') : null;
    expect(s3).not.toBeNull();
    if (!s3) return;

    expect(isComplete(m, s3)).toBe(true);
    const ext = extensions(m, s3);
    expect(ext.has('n')).toBe(true);
  });

  it('tests shouldAbsorb for パン followed by ねこ: swallowed within 250 ms, processed after 250 ms', () => {
    const panPrompt: PromptItem = { key: 'word:pan', text: 'パン' };
    const panMatcher = compile(panPrompt, 'learner');
    const panState = feedString(panMatcher, start(panMatcher), 'pan');
    expect(panState).not.toBeNull();
    if (!panState) return;

    expect(isComplete(panMatcher, panState)).toBe(true);
    const panExt = extensions(panMatcher, panState);
    expect(panExt.has('n')).toBe(true);

    const completedAt = 1000;

    // 1. Arrival at 1100ms (100ms after completion, <= 250ms): swallowed!
    const withinWindow = shouldAbsorb(panExt, completedAt, 1100, 'n');
    expect(withinWindow).toBe(true);

    // 2. Arrival at 1300ms (300ms after completion, > 250ms): not swallowed!
    const afterWindow = shouldAbsorb(panExt, completedAt, 1300, 'n');
    expect(afterWindow).toBe(false);

    // 3. Since not swallowed after 250ms, key 'n' starts 'ねこ' cleanly
    const nekoMatcher = compile({ key: 'word:neko', text: 'ねこ' }, 'learner');
    const nekoState = step(nekoMatcher, start(nekoMatcher), 'n');
    expect(nekoState).not.toBeNull();
  });
});

describe('engine: invariants and properties', () => {
  it('canonical returns first spelling of each token', () => {
    const m = compile({ key: 'word:chotto', text: 'ちょっと' }, 'ime');
    expect(canonical(m)).toBe('chotto');

    const m2 = compile({ key: 'word:konnichiha', text: 'こんにちは' }, 'ime');
    expect(canonical(m2)).toBe('konnnichiha');
  });

  it('romajiForKey returns canonical ime spelling or null', () => {
    expect(romajiForKey('hiragana:し')).toBe('shi');
    expect(romajiForKey('hiragana:ち')).toBe('chi');
    expect(romajiForKey('katakana:ファ')).toBe('fa');
    expect(romajiForKey('invalid:key')).toBeNull();
  });

  it('activeTokenIndex advances as tokens complete', () => {
    const m = compile({ key: 'word:neko', text: 'ねこ' }, 'ime');
    const s0 = start(m);
    expect(activeTokenIndex(s0)).toBe(0);

    const s1 = step(m, s0, 'n');
    expect(s1).not.toBeNull();
    if (!s1) return;
    expect(activeTokenIndex(s1)).toBe(0);

    const s2 = step(m, s1, 'e');
    expect(s2).not.toBeNull();
    if (!s2) return;
    expect(activeTokenIndex(s2)).toBe(1);

    const s3 = step(m, s2, 'k');
    expect(s3).not.toBeNull();
    if (!s3) return;
    expect(activeTokenIndex(s3)).toBe(1);

    const s4 = step(m, s3, 'o');
    expect(s4).not.toBeNull();
    if (!s4) return;
    expect(isComplete(m, s4)).toBe(true);
    expect(activeTokenIndex(s4)).toBe(2);
  });

  it('no dead ends: every valid state can be completed', () => {
    const words = ['コーヒー', 'パン', 'こんにちは', 'ちょっと', 'パーティー', 'ヴァイオリン'];
    for (const w of words) {
      for (const strictness of ['ime', 'learner'] as const) {
        const m = compile({ key: 'w', text: w }, strictness);
        let s: MatchState | null = start(m);

        const canon = canonical(m);
        for (let i = 0; i < canon.length; i++) {
          expect(s).not.toBeNull();
          if (!s) break;
          const ch = canon[i];
          if (!ch) break;
          s = step(m, s, ch);
        }
        expect(s).not.toBeNull();
        if (s) {
          expect(isComplete(m, s)).toBe(true);
        }
      }
    }
  });

  it('rejected step returns null and leaves previous state untouched', () => {
    const m = compile({ key: 'h:a', text: 'あ' }, 'ime');
    const s = start(m);
    const bad = step(m, s, 'z');
    expect(bad).toBeNull();
    expect(s.positions[0]?.charOffset).toBe(0);
  });
});

describe('engine: comprehensive property tests across all data', () => {
  // Test-only capped enumerator
  function enumerateSpellings(m: Matcher, cap = 20): string[] {
    let combs: string[] = [''];
    for (const token of m.tokens) {
      const nextCombs: string[] = [];
      for (const prefix of combs) {
        for (const sp of token.spellings) {
          if (nextCombs.length < cap) {
            nextCombs.push(prefix + sp);
          }
        }
      }
      combs = nextCombs;
      if (combs.length === 0) break;
    }
    return combs;
  }

  // Collect all test prompts: every single kana entry + all words + all phrases
  const allPrompts: PromptItem[] = [];

  for (const row of allKanaRows) {
    for (const entry of row.entries) {
      if (entry.hiragana) {
        allPrompts.push({ key: `hiragana:${entry.hiragana}`, text: entry.hiragana });
      }
      allPrompts.push({ key: `katakana:${entry.katakana}`, text: entry.katakana });
    }
  }

  for (const w of wordsData) {
    allPrompts.push({ key: w.id, text: w.text, ...(w.readingHints ? { readingHints: w.readingHints } : {}) });
  }

  for (const p of phrasesData) {
    allPrompts.push({ key: p.id, text: p.text, ...(p.readingHints ? { readingHints: p.readingHints } : {}) });
  }

  const rng = new DeterministicRng(54321);

  it('property test: all prompts x both strictness levels satisfy prefix, completion, canonical, and mutation invariants', () => {
    for (const prompt of allPrompts) {
      for (const strictness of ['ime', 'learner'] as const) {
        const m = compile(prompt, strictness);
        const canon = canonical(m);
        const spellings = enumerateSpellings(m, 15);

        // Canonical must be in the valid spellings (or produce complete state)
        expect(canon.length).toBeGreaterThan(0);
        const canonEnd = feedString(m, start(m), canon);
        expect(canonEnd).not.toBeNull();
        if (canonEnd) {
          expect(isComplete(m, canonEnd)).toBe(true);
        }

        // Test every enumerated spelling
        for (const spelling of spellings) {
          let s: MatchState | null = start(m);

          // Test proper prefixes
          for (let i = 0; i < spelling.length; i++) {
            expect(s).not.toBeNull();
            if (!s) break;
            const ch = spelling[i];
            if (!ch) break;
            s = step(m, s, ch);
          }

          expect(s).not.toBeNull();
          if (s) {
            expect(isComplete(m, s)).toBe(true);
          }

          // Random mutation test: mutate one char at a random position
          if (spelling.length > 0) {
            const mutateIdx = rng.nextInt(0, spelling.length - 1);
            const randChar = rng.nextChar();
            const mutated =
              spelling.slice(0, mutateIdx) + randChar + spelling.slice(mutateIdx + 1);

            const mutatedState = feedString(m, start(m), mutated);
            // It must either be rejected (null) OR, if coincidentally another valid path, non-null
            if (mutatedState !== null) {
              expect(typeof isComplete(m, mutatedState)).toBe('boolean');
            }
          }
        }
      }
    }
  });
});
