import { describe, expect, it } from 'vitest';
import type { Strictness } from '../types';
import { engine, feed, prompts } from './test-util';

function after(texts: string[], mode: Strictness, input: string) {
  const m = engine.compile(prompts(...texts), mode);
  const { state } = feed(m, input);
  if (state === null) throw new Error(`${input} is rejected`);
  return { m, s: state };
}

describe('view', () => {
  it('shows the display position: relaxed こんな (spec example)', () => {
    const v = (input: string) => {
      const { m, s } = after(['こんな'], 'learner', input);
      return engine.view(m, s);
    };
    expect(v('kon')).toMatchObject({ displayedTokens: 2, pendingLatin: '' });
    expect(v('konn')).toMatchObject({ displayedTokens: 2, pendingLatin: '' });
    expect(v('konna')).toMatchObject({ displayedTokens: 3, pendingLatin: '' });
  });

  it('shows the typed latin beyond the converted tokens: k, ki, kit', () => {
    const v = (input: string) => {
      const { m, s } = after(['きた'], 'ime', input);
      return engine.view(m, s);
    };
    expect(v('k')).toMatchObject({ displayedTokens: 0, pendingLatin: 'k' });
    expect(v('ki')).toMatchObject({ displayedTokens: 1, pendingLatin: '' });
    expect(v('kit')).toMatchObject({ displayedTokens: 1, pendingLatin: 't' });
  });

  it('is empty at the start', () => {
    const m = engine.compile(prompts('あ'), 'ime');
    expect(engine.view(m, engine.start(m))).toEqual({
      displayedTokens: 0,
      pendingLatin: '',
      activeToken: 0,
    });
  });

  it('breaks a tie on the spelling that comes first in table order', () => {
    const { m, s } = after(['こんな'], 'ime', 'kon');
    expect(engine.view(m, s)).toMatchObject({ displayedTokens: 1, pendingLatin: 'n' });
  });

  it('counts skip tokens that have been passed as displayed', () => {
    const { m, s } = after(['あ、い'], 'ime', 'a');
    expect(engine.view(m, s)).toMatchObject({ displayedTokens: 2, activeToken: 2 });
  });

  it('keeps the highlighted token behind the displayed ones while a ん is undecided', () => {
    const { m, s } = after(['こんな'], 'learner', 'kon');
    const v = engine.view(m, s);
    expect(v.displayedTokens).toBe(2);
    expect(v.activeToken).toBe(1);
  });

  it('ends at the token count when the stream is complete', () => {
    const { m, s } = after(['あ'], 'ime', 'a');
    expect(engine.view(m, s)).toMatchObject({ displayedTokens: 1, activeToken: 1 });
  });
});

describe('errorTarget (D10)', () => {
  it('is the token being typed', () => {
    expect(engine.errorTarget(...pair(after(['ねこ'], 'ime', '')))).toBe(0);
    expect(engine.errorTarget(...pair(after(['ねこ'], 'ime', 'ne')))).toBe(1);
  });

  it('is the minimum over active positions inside a prompt: an undecided ん is charged', () => {
    expect(engine.errorTarget(...pair(after(['こんな'], 'learner', 'kon')))).toBe(1);
    expect(engine.errorTarget(...pair(after(['ほん', 'ねこ'], 'ime', 'honn')))).toBe(2);
  });

  it('is never before the prompt on display: the next word is charged, not its ん (A34)', () => {
    expect(engine.errorTarget(...pair(after(['ほん', 'ねこ'], 'learner', 'hon')))).toBe(2);
    expect(engine.errorTarget(...pair(after(['ほん', 'か'], 'ime', 'hon')))).toBe(2);
    // The leading skip token of that prompt needs no input, so its first real token is charged.
    expect(engine.errorTarget(...pair(after(['ほん', '「ね'], 'learner', 'hon')))).toBe(3);
  });

  it('stays on an undecided ん while the prompt that holds it is on display', () => {
    // Strict ん before a vowel needs nn: the display stays on ほん.
    expect(engine.errorTarget(...pair(after(['ほん', 'あ'], 'ime', 'hon')))).toBe(1);
  });

  it('stays on the last token that needs input once the stream is complete', () => {
    expect(engine.errorTarget(...pair(after(['あ'], 'ime', 'a')))).toBe(0);
    expect(engine.errorTarget(...pair(after(['あ。'], 'ime', 'a')))).toBe(0);
    const empty = engine.compile([], 'ime');
    expect(engine.errorTarget(empty, engine.start(empty))).toBe(0);
  });
});

function pair<T extends { m: unknown; s: unknown }>(x: T): [T['m'], T['s']] {
  return [x.m, x.s];
}

describe('committedTimings', () => {
  it('reports the keystrokes of each committed token', () => {
    const { m, s } = after(['ねこ'], 'ime', 'neko');
    expect(engine.committedTimings(m, s)).toEqual([
      { tokenIndex: 0, firstKey: 0, lastKey: 1 },
      { tokenIndex: 1, firstKey: 2, lastKey: 3 },
    ]);
  });

  it('leaves out the token in progress', () => {
    const { m, s } = after(['ねこ'], 'ime', 'nek');
    expect(engine.committedTimings(m, s).map((t) => t.tokenIndex)).toEqual([0]);
  });

  it('withholds a ん that the paths disagree on, then reports it once settled', () => {
    const konn = after(['こんな'], 'learner', 'konn');
    expect(engine.committedTimings(konn.m, konn.s).map((t) => t.tokenIndex)).toEqual([0]);
    const konna = after(['こんな'], 'learner', 'konna');
    expect(engine.committedTimings(konna.m, konna.s)).toEqual([
      { tokenIndex: 0, firstKey: 0, lastKey: 1 },
      { tokenIndex: 1, firstKey: 2, lastKey: 2 },
      { tokenIndex: 2, firstKey: 3, lastKey: 4 },
    ]);
  });

  it('does not inflate a ん resolved by the next prompt', () => {
    const { m, s } = after(['ほん', 'ねこ'], 'learner', 'honne');
    expect(engine.committedTimings(m, s)).toEqual([
      { tokenIndex: 0, firstKey: 0, lastKey: 1 },
      { tokenIndex: 1, firstKey: 2, lastKey: 2 },
      { tokenIndex: 2, firstKey: 3, lastKey: 4 },
    ]);
  });

  it('gives skip tokens no timing', () => {
    const { m, s } = after(['あ、い'], 'ime', 'ai');
    expect(engine.committedTimings(m, s).map((t) => t.tokenIndex)).toEqual([0, 2]);
  });

  it('is empty at the start', () => {
    const m = engine.compile(prompts('あ'), 'ime');
    expect(engine.committedTimings(m, engine.start(m))).toEqual([]);
  });
});

describe('canonical, spellingsFor, canonicalFor', () => {
  it('builds the hint from the first spelling of each token', () => {
    const m = engine.compile(prompts('こんにちは', 'まっちゃ', 'コーヒー', 'あ、い'), 'learner');
    expect(engine.canonical(m, 0)).toBe('konnnichiha');
    expect(engine.canonical(m, 1)).toBe('matcha');
    expect(engine.canonical(m, 2)).toBe('ko-hi-');
    expect(engine.canonical(m, 3)).toBe('ai');
    expect(engine.canonical(m, 9)).toBe('');
  });

  it('is accepted by the matcher in both modes', () => {
    for (const mode of ['learner', 'ime'] as const) {
      const m = engine.compile(prompts('かんた', 'ほん'), mode);
      const text = engine.canonical(m, 0) + engine.canonical(m, 1);
      const { state } = feed(m, text);
      expect(state && engine.isComplete(m, state)).toBe(true);
    }
  });

  it('lists the spellings of a kana per mode, canonical first', () => {
    expect(engine.spellingsFor('hiragana:を', 'ime')).toEqual(['wo']);
    expect(engine.spellingsFor('hiragana:を', 'learner')).toEqual(['wo', 'o']);
    expect(engine.spellingsFor('hiragana:ん', 'learner')).toEqual(['nn', "n'", 'n']);
    expect(engine.spellingsFor('katakana:ヶ', 'ime')).toEqual(['xke', 'lke']);
    expect(engine.spellingsFor('hiragana:ヶ', 'ime')).toEqual([]);
  });

  it('gives the canonical spelling of a kana, empty for an unknown key', () => {
    expect(engine.canonicalFor('hiragana:し')).toBe('shi');
    expect(engine.canonicalFor('katakana:ン')).toBe('nn');
    expect(engine.canonicalFor('hiragana:ヶ')).toBe('');
  });
});

describe('observers on states the engine does not produce (hand-made)', () => {
  const m = engine.compile(prompts('あい', 'うえ'), 'ime');
  const done = (token: number, firstKey: number) => ({
    token,
    spelling: 0,
    offset: 1,
    firstKey,
    lastKey: firstKey,
    path: null,
  });

  it('view of an empty state is empty', () => {
    expect(engine.view(m, { positions: [], keys: 0 })).toMatchObject({
      displayedTokens: 0,
      pendingLatin: '',
    });
  });

  it('view breaks a full tie on the earlier token', () => {
    const s = { positions: [done(2, 2), done(0, 0)], keys: 3 };
    expect(engine.view(m, s).displayedTokens).toBe(1);
  });

  it('timings are empty for an empty state and ignore tokens beyond the shared limit', () => {
    expect(engine.committedTimings(m, { positions: [], keys: 0 })).toEqual([]);
    const ahead = { positions: [done(1, 1), { ...done(0, 0), path: null }], keys: 2 };
    expect(engine.committedTimings(m, ahead).map((t) => t.tokenIndex)).toEqual([]);
  });
});

describe('ー after a spelling that does not end in a vowel (custom table)', () => {
  it('adds no vowel for it', async () => {
    const { createEngine } = await import('./engine');
    const custom = createEngine([
      { entries: [{ hiragana: 'あ', katakana: 'ア', ime: ['a', 'ak'], learner: [] }] },
    ]);
    const m = custom.compile([{ key: 'k', text: 'あー' }], 'learner');
    expect(m.tokens[1]?.spellings.map((s) => s.text)).toEqual(['-', 'a']);
  });
});
