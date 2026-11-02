import { describe, expect, it } from 'vitest';
import type { Strictness } from '../types';
import { allKanaRows, SKIP_CHARACTERS, standaloneRows } from '../data';
import { engine, prompts, Rng } from './test-util';
import type { StreamMatcher, StreamState } from './types';

const ALPHABET = "abcdefghijklmnopqrstuvwxyz-'".split('');

const GLYPHS: string[] = [
  ...[...allKanaRows, ...standaloneRows].flatMap((r) =>
    r.entries.flatMap((e) => (e.hiragana === undefined ? [e.katakana] : [e.hiragana, e.katakana])),
  ),
  ...['っ', 'ッ', 'ん', 'ン', 'ー', 'ん', 'っ', 'ー'],
  ...Array.from(SKIP_CHARACTERS),
];

function randomPrompts(rng: Rng): string[] {
  const count = rng.int(1, 3);
  return Array.from({ length: count }, () =>
    Array.from({ length: rng.int(1, 5) }, () => rng.pick(GLYPHS)).join(''),
  );
}

function acceptedKeys(m: StreamMatcher, s: StreamState): string[] {
  return ALPHABET.filter((k) => engine.step(m, s, k) !== null);
}

// Walks the matcher with random accepted keys until the stream is complete.
function walk(m: StreamMatcher, rng: Rng): { keys: string; state: StreamState } {
  let state = engine.start(m);
  let keys = '';
  for (let guard = 0; guard < 400; guard++) {
    const accepted = acceptedKeys(m, state);
    if (accepted.length === 0 || (engine.isComplete(m, state) && rng.next() < 0.4)) break;
    const key = rng.pick(accepted);
    const next = engine.step(m, state, key);
    if (next === null) throw new Error('an accepted key was rejected');
    state = next;
    keys += key;
  }
  return { keys, state };
}

describe('properties over random streams', () => {
  const rng = new Rng(20261102);
  const cases = Array.from({ length: 300 }, () => randomPrompts(rng));

  it('every stream compiles in both modes', () => {
    for (const texts of cases) {
      for (const mode of ['learner', 'ime'] as const) {
        expect(engine.compile(prompts(...texts), mode).tokens.length).toBeGreaterThan(0);
      }
    }
  });

  it('has no dead ends: every walk ends in a complete stream', () => {
    for (const texts of cases) {
      for (const mode of ['learner', 'ime'] as const satisfies readonly Strictness[]) {
        const m = engine.compile(prompts(...texts), mode);
        const { keys, state } = walk(m, rng);
        expect(engine.isComplete(m, state), `${texts.join('|')} ${mode} ← ${keys}`).toBe(true);
      }
    }
  });

  it('relaxed accepts every input strict accepts (invariant)', () => {
    for (const texts of cases) {
      const strict = engine.compile(prompts(...texts), 'ime');
      const relaxed = engine.compile(prompts(...texts), 'learner');
      for (let w = 0; w < 4; w++) {
        const { keys, state } = walk(strict, rng);
        let s: StreamState | null = engine.start(relaxed);
        for (const key of keys) {
          s = s === null ? null : engine.step(relaxed, s, key);
          expect(s, `${texts.join('|')} ← ${keys} at ${key}`).not.toBeNull();
        }
        expect(s !== null && engine.isComplete(relaxed, s)).toBe(engine.isComplete(strict, state));
      }
    }
  });

  it('rejects a mutated key only when another valid path exists', () => {
    for (const texts of cases.slice(0, 100)) {
      const m = engine.compile(prompts(...texts), 'ime');
      const { keys } = walk(m, rng);
      if (keys.length === 0) continue;
      const at = rng.int(0, keys.length - 1);
      const wrong = rng.pick(ALPHABET.filter((k) => k !== keys.charAt(at)));
      let s: StreamState | null = engine.start(m);
      for (let i = 0; i < at && s !== null; i++) s = engine.step(m, s, keys.charAt(i));
      expect(s).not.toBeNull();
      if (s === null) continue;
      expect(engine.step(m, s, wrong) === null).toBe(!acceptedKeys(m, s).includes(wrong));
    }
  });
});
