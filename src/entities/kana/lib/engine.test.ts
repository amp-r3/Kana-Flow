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
import type { PromptItem } from '../model/types';

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
});

describe('engine: ん contextual lookahead', () => {
  it('パン accepts pann only in ime, but pan and pann in learner', () => {
    const prompt: PromptItem = { key: 'word:pan', text: 'パン' };
    // IME mode: at end of prompt, requires nn or n'
    expect(completesWith(prompt, 'ime', 'pann')).toBe(true);
    expect(completesWith(prompt, 'ime', "pan'")).toBe(true);
    expect(completesWith(prompt, 'ime', 'pan')).toBe(false);

    // Learner mode: bare n accepted anywhere
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
    // In IME mode: ん followed by に (starts with n) -> bare n is rejected!
    expect(completesWith(prompt, 'ime', 'konnnichiha')).toBe(true);
    expect(completesWith(prompt, 'ime', 'konnichiha')).toBe(false);
    expect(completesWith(prompt, 'ime', 'konnnichiwa')).toBe(false);

    // In Learner mode:
    expect(completesWith(prompt, 'learner', 'konnnichiha')).toBe(true);
    expect(completesWith(prompt, 'learner', 'konnichiha')).toBe(true);
    expect(completesWith(prompt, 'learner', 'konnnichiwa')).toBe(true);
    expect(completesWith(prompt, 'learner', 'konnichiwa')).toBe(true);
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
    // IME mode: only dash is valid
    expect(completesWith(prompt, 'ime', 'ko-hi-')).toBe(true);
    expect(completesWith(prompt, 'ime', 'koohii')).toBe(false);
    expect(completesWith(prompt, 'ime', 'ko-hii')).toBe(false);
    expect(completesWith(prompt, 'ime', 'koohi-')).toBe(false);

    // Learner mode: vowel repetition is valid
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

describe('engine: trailing extensions and absorption window', () => {
  it('returns non-empty extensions when complete in learner mode for パン', () => {
    const prompt: PromptItem = { key: 'word:pan', text: 'パン' };
    const m = compile(prompt, 'learner');
    const s0 = start(m);

    // Type 'p', 'a', 'n' -> prompt completes via spelling 'n'
    const s1 = step(m, s0, 'p');
    expect(s1).not.toBeNull();
    const s2 = s1 ? step(m, s1, 'a') : null;
    expect(s2).not.toBeNull();
    const s3 = s2 ? step(m, s2, 'n') : null;
    expect(s3).not.toBeNull();
    if (!s3) return;

    expect(isComplete(m, s3)).toBe(true);
    const ext = extensions(m, s3);
    // Spelling 'nn' has second 'n' available as extension
    expect(ext.has('n')).toBe(true);
  });

  it('simulates absorption window for パン followed by ねこ', () => {
    // When パン completes in learner mode with 'pan':
    const panPrompt: PromptItem = { key: 'word:pan', text: 'パン' };
    const panMatcher = compile(panPrompt, 'learner');
    const panState = feedString(panMatcher, start(panMatcher), 'pan');
    expect(panState).not.toBeNull();
    if (!panState) return;

    expect(isComplete(panMatcher, panState)).toBe(true);
    const panExt = extensions(panMatcher, panState);
    expect(panExt.has('n')).toBe(true);

    const completedAt = 1000;

    // Simulation of controller absorption check:
    function handleFirstKeyNextPrompt(
      key: string,
      arrivalTime: number,
      nextPromptText: string,
    ): { swallowed: boolean; nextState: MatchState | null } {
      const isWithinWindow = arrivalTime - completedAt <= 250;
      const isTrailingExtension = panExt.has(key);

      if (isWithinWindow && isTrailingExtension) {
        // Swallowed silently per Section 5.4, even if valid for next prompt!
        return { swallowed: true, nextState: null };
      }

      // After 250ms or not extension, process normally
      const nextMatcher = compile({ key: 'test', text: nextPromptText }, 'learner');
      const nextInit = start(nextMatcher);
      const nextStep = step(nextMatcher, nextInit, key);
      return { swallowed: false, nextState: nextStep };
    }

    // 1. Second 'n' arrives at 110ms (<= 250ms) -> swallowed!
    const fastN = handleFirstKeyNextPrompt('n', 1110, 'ねこ');
    expect(fastN.swallowed).toBe(true);

    // 2. 'n' arrives at 300ms (> 250ms) -> not swallowed, starts ねこ!
    const slowN = handleFirstKeyNextPrompt('n', 1300, 'ねこ');
    expect(slowN.swallowed).toBe(false);
    expect(slowN.nextState).not.toBeNull();
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

    // Completing 'ne' moves live positions to token 1 ('ko')
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

        // Follow canonical path
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
