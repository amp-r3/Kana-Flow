import { describe, expect, it } from 'vitest';
import { allKanaRows } from '../data';
import { createEngine } from './engine';

describe('createEngine: the table is a parameter', () => {
  const mini = createEngine([
    { entries: [{ hiragana: 'あ', katakana: 'ア', ime: ['a'], learner: [] }] },
  ]);
  const full = createEngine(allKanaRows);

  it('compiles only what its own table has, with no state shared between engines', () => {
    const m = mini.compile([{ key: 'k', text: 'あ' }], 'ime');
    expect(mini.canonical(m, 0)).toBe('a');
    expect(mini.canonicalFor('hiragana:あ')).toBe('a');
    expect(mini.canonicalFor('hiragana:か')).toBe('');
    expect(full.canonicalFor('hiragana:か')).toBe('ka');
    expect(() => mini.compile([{ key: 'k', text: 'か' }], 'ime')).toThrow(/Unrepresentable/);
  });
});
