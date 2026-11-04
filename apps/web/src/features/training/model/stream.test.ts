import { describe, it, expect } from 'vitest';
import { compile } from '@/entities/prompt';
import type { PromptItem } from '@/entities/prompt';
import { BEHIND_TOKENS, lastToken, staleCount, streamPromptsOf } from './stream';
import type { StreamPrompt } from './stream';

const item = (text: string): PromptItem => ({ key: `test:${text}`, text });

describe('stream: tokens of the prompts to draw', () => {
  it('lists the glyph of each token and marks the ones that need no input', () => {
    const matcher = compile([item('きゃっち、'), item('ねこ')], 'learner');
    const [first, second] = streamPromptsOf(matcher, 0, 0, 0);
    expect(first?.tokens).toEqual([
      { glyph: 'きゃ', skip: false },
      { glyph: 'っち', skip: false },
      { glyph: '、', skip: true },
    ]);
    expect(second?.tokens.map((token) => token.glyph)).toEqual(['ね', 'こ']);
  });

  it('numbers prompts and tokens from the start of the test, not of the matcher', () => {
    const matcher = compile([item('あい'), item('う')], 'learner');
    // As if 5 prompts and 12 tokens had been dropped by compact().
    const [first, second] = streamPromptsOf(matcher, 0, 5, 12);
    expect(first).toMatchObject({ index: 5, firstToken: 12 });
    expect(second).toMatchObject({ index: 6, firstToken: 14 });
    expect(first && lastToken(first)).toBe(13);
  });

  it('starts at the given prompt of the matcher', () => {
    const matcher = compile([item('あ'), item('い'), item('う')], 'learner');
    const rest = streamPromptsOf(matcher, 1, 0, 0);
    expect(rest.map((prompt) => prompt.index)).toEqual([1, 2]);
    expect(rest.map((prompt) => prompt.firstToken)).toEqual([1, 2]);
  });
});

describe('stream: what leaves the window', () => {
  const prompt = (index: number, firstToken: number, count: number): StreamPrompt => ({
    index,
    firstToken,
    tokens: Array.from({ length: count }, () => ({ glyph: 'あ', skip: false })),
  });

  it('drops the prompts that ended more than BEHIND_TOKENS before the caret', () => {
    // Prompts of 10 tokens: [0-9] [10-19] [20-29] [30-39] [40-49].
    const prompts = [0, 1, 2, 3, 4].map((i) => prompt(i, i * 10, 10));
    // Caret at 45: stale = ends before 45 - 30 = 15, so only [0-9].
    expect(staleCount(prompts, 45)).toBe(1);
    // Caret at 60: ends before 30, so [0-9] [10-19] [20-29].
    expect(staleCount(prompts, 60)).toBe(3);
  });

  it('keeps a prompt that ends exactly BEHIND_TOKENS behind', () => {
    const prompts = [prompt(0, 0, 10), prompt(1, 10, 10)];
    expect(staleCount(prompts, 9 + BEHIND_TOKENS)).toBe(0);
    expect(staleCount(prompts, 9 + BEHIND_TOKENS + 1)).toBe(1);
  });

  it('never drops the last prompt', () => {
    const prompts = [prompt(0, 0, 5), prompt(1, 5, 5)];
    expect(staleCount(prompts, 10_000)).toBe(1);
    expect(staleCount([], 100)).toBe(0);
  });
});
