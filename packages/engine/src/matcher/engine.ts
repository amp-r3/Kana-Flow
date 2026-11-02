import type { EngineTable, PromptItem, Strictness } from '../types';
import { buildGlyphIndex, compileStream } from './compile';
import { extensions, isComplete, start, step } from './step';
import type { StreamMatcher, StreamState } from './types';

// The stream engine of spec "Input engine rules". It grows next to the per-prompt engine during
// P1 and replaces it when the web app switches over.
export type StreamEngine = {
  readonly compile: (prompts: readonly PromptItem[], strictness: Strictness) => StreamMatcher;
  readonly start: (m: StreamMatcher) => StreamState;
  readonly step: (m: StreamMatcher, s: StreamState, ch: string) => StreamState | null;
  readonly isComplete: (m: StreamMatcher, s: StreamState) => boolean;
  readonly extensions: (m: StreamMatcher, s: StreamState) => ReadonlySet<string>;
};

export function createStreamEngine(table: EngineTable): StreamEngine {
  const index = buildGlyphIndex(table);
  return {
    compile: (prompts, strictness) => compileStream(index, prompts, strictness),
    start,
    step,
    isComplete,
    extensions,
  };
}
