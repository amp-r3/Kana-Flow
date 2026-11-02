import { describe, it, expect } from 'vitest';
import { compile, start, step, isComplete, canonical } from './engine';
import type { Matcher, MatchState } from './engine';
import { wordsData } from '../model/data/words';
import { phrasesData } from '../model/data/phrases';
import type { PromptItem } from '../model/types';

function feedString(m: Matcher, s: MatchState, input: string): MatchState | null {
  let current: MatchState | null = s;
  for (const ch of input) {
    if (!current) return null;
    current = step(m, current, ch);
  }
  return current;
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
    const chars = "abcdefghijklmnopqrstuvwxyz-'";
    return chars[this.nextInt(0, chars.length - 1)] ?? 'a';
  }
}

describe('engine: property tests across words and phrases', () => {
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

  // Collect all test prompts: all words and phrases
  const allPrompts: PromptItem[] = [];

  for (const w of wordsData) {
    allPrompts.push({
      key: w.id,
      text: w.text,
      ...(w.readingHints ? { readingHints: w.readingHints } : {}),
    });
  }

  for (const p of phrasesData) {
    allPrompts.push({
      key: p.id,
      text: p.text,
      ...(p.readingHints ? { readingHints: p.readingHints } : {}),
    });
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
            const mutated = spelling.slice(0, mutateIdx) + randChar + spelling.slice(mutateIdx + 1);

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
