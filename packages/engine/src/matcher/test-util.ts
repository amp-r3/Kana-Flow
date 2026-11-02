import type { PromptItem, Strictness } from '../types';
import { engineTable } from '../data';
import { createStreamEngine } from './engine';
import type { StreamMatcher, StreamState } from './types';

export const engine = createStreamEngine(engineTable);

export function prompts(...texts: string[]): PromptItem[] {
  return texts.map((text, i) => ({ key: `p${i}`, text }));
}

export function feed(
  m: StreamMatcher,
  input: string,
): { state: StreamState | null; failedAt: number } {
  let state = engine.start(m);
  for (let i = 0; i < input.length; i++) {
    const next = engine.step(m, state, input.charAt(i));
    if (next === null) return { state: null, failedAt: i };
    state = next;
  }
  return { state, failedAt: -1 };
}

export function acceptsItems(items: PromptItem[], mode: Strictness, input: string): boolean {
  const m = engine.compile(items, mode);
  const { state } = feed(m, input);
  return state !== null && engine.isComplete(m, state);
}

export function accepts(texts: string[], mode: Strictness, input: string): boolean {
  return acceptsItems(prompts(...texts), mode, input);
}

// Index of the key at which `input` is rejected, or -1 if it is not rejected.
export function rejectedAt(texts: string[], mode: Strictness, input: string): number {
  return feed(engine.compile(prompts(...texts), mode), input).failedAt;
}

export class Rng {
  private s: number;
  constructor(seed: number) {
    this.s = seed;
  }
  next(): number {
    this.s = (this.s * 1103515245 + 12345) & 0x7fffffff;
    return this.s / 0x7fffffff;
  }
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  pick<T>(items: readonly T[]): T {
    const item = items[this.int(0, items.length - 1)];
    if (item === undefined) throw new Error('pick from an empty list');
    return item;
  }
}
