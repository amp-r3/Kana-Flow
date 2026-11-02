import type { EngineTable, KanaKey, PromptItem, Strictness } from '../types';
import { appendPrompts, buildGlyphIndex, compileStream, kanaTexts } from './compile';
import { compact } from './compact';
import { canonical, committedTimings, errorTarget, view } from './observe';
import { committedPrompts, extensions, isComplete, start, step } from './step';
import type { EngineView, StreamMatcher, StreamState, TokenTiming } from './types';

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
  // Timings of the tokens committed in every position that agree on their keystrokes.
  readonly committedTimings: (m: StreamMatcher, s: StreamState) => readonly TokenTiming[];
  // Live conversion for the input field and the highlighted token.
  readonly view: (m: StreamMatcher, s: StreamState) => EngineView;
  // Token a rejected key is charged to (D10).
  readonly errorTarget: (m: StreamMatcher, s: StreamState) => number;
  // Drops committed prompts and rebases token indices; keystroke indices stay.
  readonly compact: (
    m: StreamMatcher,
    s: StreamState,
  ) => { m: StreamMatcher; s: StreamState; droppedTokens: number };
  // Hint text for a prompt of the window (Esc).
  readonly canonical: (m: StreamMatcher, promptIndex: number) => string;
  // All spellings of a kana in a mode, canonical first; empty for an unknown key.
  readonly spellingsFor: (key: KanaKey, strictness: Strictness) => readonly string[];
  readonly canonicalFor: (key: KanaKey) => string;
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
    committedTimings,
    view,
    errorTarget,
    compact,
    canonical,
    spellingsFor: (key, strictness) => {
      const info = index.byKey.get(key);
      return info === undefined ? [] : kanaTexts(info, strictness);
    },
    canonicalFor: (key) => index.byKey.get(key)?.ime[0] ?? '',
  };
}
