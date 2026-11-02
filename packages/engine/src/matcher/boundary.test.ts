import { describe, expect, it } from 'vitest';
import type { Strictness } from '../types';
import { accepts, engine, feed, prompts, rejectedAt } from './test-util';

function committed(texts: string[], mode: Strictness, input: string): number {
  const m = engine.compile(prompts(...texts), mode);
  const { state } = feed(m, input);
  if (state === null) throw new Error(`${input} is rejected`);
  return engine.committedPrompts(m, state);
}

describe('ん across a prompt boundary', () => {
  it('ん → n: nn or n and the next n (A15, D2)', () => {
    for (const input of ['honneko', 'honnneko', "hon'neko"]) {
      expect(accepts(['ほん', 'ねこ'], 'learner', input), input).toBe(true);
    }
    expect(accepts(['ほん', 'ねこ'], 'ime', 'honneko')).toBe(false);
    expect(rejectedAt(['ほん', 'ねこ'], 'ime', 'honneko')).toBe(4);
  });

  it('ん → vowel: a bare n only in relaxed mode (A15)', () => {
    expect(accepts(['ほん', 'あめ'], 'learner', 'honame')).toBe(true);
    expect(rejectedAt(['ほん', 'あめ'], 'ime', 'honame')).toBe(3);
    for (const input of ['honname', "hon'ame"]) {
      expect(accepts(['ほん', 'あめ'], 'ime', input), input).toBe(true);
    }
  });

  it('ん → consonant: a bare n in both modes', () => {
    for (const mode of ['learner', 'ime'] as const) {
      expect(accepts(['ほん', 'かば'], mode, 'honkaba'), mode).toBe(true);
    }
  });

  it('ん → skip token: a bare n completes it whatever follows', () => {
    for (const mode of ['learner', 'ime'] as const) {
      expect(accepts(['ほん。', 'あめ'], mode, 'honame'), mode).toBe(true);
      expect(accepts(['ほん', '。あめ'], mode, 'honame'), mode).toBe(true);
    }
  });

  it('っ at a boundary never merges with the next prompt', () => {
    expect(rejectedAt(['あっ', 'たま'], 'learner', 'attama')).toBe(1);
    for (const input of ['axtutama', 'altutama', 'axtsutama']) {
      expect(accepts(['あっ', 'たま'], 'ime', input), input).toBe(true);
    }
  });

  it('ー at the start of the next prompt takes only the hyphen', () => {
    expect(accepts(['こ', 'ー'], 'learner', 'ko-')).toBe(true);
    expect(accepts(['こ', 'ー'], 'learner', 'koo')).toBe(false);
  });
});

describe('committedPrompts', () => {
  it('is 0 at the start and counts a leading skip-only prompt as committed', () => {
    const m = engine.compile(prompts('あ', 'い'), 'ime');
    expect(engine.committedPrompts(m, engine.start(m))).toBe(0);
    const skip = engine.compile(prompts('、', 'い'), 'ime');
    expect(engine.committedPrompts(skip, engine.start(skip))).toBe(1);
  });

  it('commits a prompt when its last token is done', () => {
    expect(committed(['あ', 'い', 'う'], 'ime', 'a')).toBe(1);
    expect(committed(['あ', 'い', 'う'], 'ime', 'ai')).toBe(2);
    expect(committed(['あ', 'い', 'う'], 'ime', 'aiu')).toBe(3);
  });

  it('does not commit a prompt in the middle of a token', () => {
    expect(committed(['あか', 'い'], 'ime', 'ak')).toBe(0);
    expect(committed(['あか', 'い'], 'ime', 'aka')).toBe(1);
  });

  it('commits trailing skip tokens and skip-only prompts together with the previous prompt', () => {
    expect(committed(['あ。', 'い'], 'ime', 'a')).toBe(1);
    expect(committed(['あ', '、', 'い'], 'ime', 'a')).toBe(2);
    expect(committed(['あ', '、', 'い'], 'ime', 'ai')).toBe(3);
  });

  it('waits for the key that resolves a ん at the end of a prompt', () => {
    expect(committed(['ほん', 'ねこ'], 'learner', 'hon')).toBe(0);
    expect(committed(['ほん', 'ねこ'], 'learner', 'honn')).toBe(1);
    expect(committed(['ほん', 'ねこ'], 'learner', 'honne')).toBe(1);
    expect(committed(['ほん', 'あめ'], 'learner', 'hon')).toBe(0);
    expect(committed(['ほん', 'あめ'], 'learner', 'hona')).toBe(1);
    expect(committed(['ほん', 'あめ'], 'learner', 'honame')).toBe(2);
  });

  it('keeps the last prompt open while a ん can still take another n, though the stream is complete', () => {
    const m = engine.compile(prompts('ほん'), 'learner');
    const hon = feed(m, 'hon').state;
    expect(hon && engine.isComplete(m, hon)).toBe(true);
    expect(hon && engine.committedPrompts(m, hon)).toBe(0);
    const honn = feed(m, 'honn').state;
    expect(honn && engine.committedPrompts(m, honn)).toBe(1);
  });
});

describe('extend', () => {
  it('returns the same matcher for no prompts', () => {
    const m = engine.compile(prompts('あ'), 'ime');
    expect(engine.extend(m, [])).toBe(m);
  });

  it('numbers the appended prompts and tokens after the existing ones', () => {
    const m = engine.extend(engine.compile(prompts('ねこ'), 'ime'), prompts('いぬ', 'とり'));
    expect(m.promptStarts).toEqual([0, 2, 4]);
    expect(m.tokens.map((t) => t.promptIndex)).toEqual([0, 0, 1, 1, 2, 2]);
  });

  it('keeps the state of a ん that was typed with a bare n before the context arrived', () => {
    const before = engine.compile(prompts('ほん'), 'ime');
    const state = feed(before, 'hon').state;
    expect(state && engine.isComplete(before, state)).toBe(true);
    const after = engine.extend(before, prompts('あめ'));
    expect(state && engine.isComplete(after, state)).toBe(false);
    // Strict mode: the bare n no longer counts, the second n does.
    expect(state && engine.step(after, state, 'a')).toBeNull();
    const second = state && engine.step(after, state, 'n');
    expect(second && engine.step(after, second, 'a')).not.toBeNull();
  });

  it('keeps the bare n valid before a consonant and, in relaxed mode, before a vowel', () => {
    const strict = engine.compile(prompts('ほん'), 'ime');
    const typed = feed(strict, 'hon').state;
    const kana = engine.extend(strict, prompts('かば'));
    const k = typed && engine.step(kana, typed, 'k');
    expect(k).not.toBeNull();

    const relaxed = engine.compile(prompts('ほん'), 'learner');
    const typedRelaxed = feed(relaxed, 'hon').state;
    const vowel = engine.extend(relaxed, prompts('あめ'));
    expect(typedRelaxed && engine.step(vowel, typedRelaxed, 'a')).not.toBeNull();
  });

  it('keeps the spelling index of a bare n that the new context rules out', () => {
    const m = engine.extend(engine.compile(prompts('ほん'), 'ime'), prompts('あめ'));
    const spellings = m.tokens[1]?.spellings;
    expect(spellings?.map((s) => s.text)).toEqual(['nn', "n'", 'n']);
    expect(spellings?.[2]?.next).toEqual([]);
  });

  it('leaves ん before a skip token alone', () => {
    const m = engine.extend(engine.compile(prompts('ほん。'), 'ime'), prompts('あめ'));
    expect(m.tokens[1]?.spellings[2]?.next).toBeNull();
  });
});
