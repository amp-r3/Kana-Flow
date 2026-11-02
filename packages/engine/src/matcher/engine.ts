import type { EngineTable, PromptItem, Strictness } from '../types';
import { appendPrompts, buildGlyphIndex, compileStream } from './compile';
import { committedPrompts, extensions, isComplete, start, step } from './step';
import type { StreamMatcher, StreamState } from './types';

// The stream engine of spec "Input engine rules". It grows next to the per-prompt engine during
// P1 and replaces it when the web app switches over.
export type StreamEngine = {
  readonly compile: (prompts: readonly PromptItem[], strictness: Strictness) => StreamMatcher;
  // Appends prompts; a state made for `m` stays valid for the result.
  readonly extend: (m: StreamMatcher, prompts: readonly PromptItem[]) => StreamMatcher;
  readonly start: (m: StreamMatcher) => StreamState;
  readonly step: (m: StreamMatcher, s: StreamState, ch: string) => StreamState | null;
  readonly isComplete: (m: StreamMatcher, s: StreamState) => boolean;
  readonly extensions: (m: StreamMatcher, s: StreamState) => ReadonlySet<string>;
  // Leading prompts committed in every active position.
  readonly committedPrompts: (m: StreamMatcher, s: StreamState) => number;
};

export function createStreamEngine(table: EngineTable): StreamEngine {
  const index = buildGlyphIndex(table);
  return {
    compile: (prompts, strictness) => compileStream(index, prompts, strictness),
    extend: (m, prompts) => appendPrompts(index, m, prompts),
    start,
    step,
    isComplete,
    extensions,
    committedPrompts,
  };
}
