import type { EngineTable, KanaKey, PromptItem, Strictness } from '../types';
import { appendPrompts, buildGlyphIndex, compileStream, kanaTexts } from './compile';
import { compact } from './compact';
import { canonical, committedTimings, errorTarget, view } from './observe';
import { committedPrompts, extensions, isComplete, start, step } from './step';
import type { EngineView, Matcher, MatchState, TokenTiming } from './types';

// The input engine of the spec "Input engine rules": a matcher over a stream of prompts.
export type Engine = {
  readonly compile: (prompts: readonly PromptItem[], strictness: Strictness) => Matcher;
  // Appends prompts; a state made for `m` stays valid for the result.
  readonly extend: (m: Matcher, prompts: readonly PromptItem[]) => Matcher;
  readonly start: (m: Matcher) => MatchState;
  readonly step: (m: Matcher, s: MatchState, ch: string) => MatchState | null;
  readonly isComplete: (m: Matcher, s: MatchState) => boolean;
  readonly extensions: (m: Matcher, s: MatchState) => ReadonlySet<string>;
  // Leading prompts committed in every active position.
  readonly committedPrompts: (m: Matcher, s: MatchState) => number;
  // Timings of the tokens committed in every position that agree on their keystrokes.
  readonly committedTimings: (m: Matcher, s: MatchState) => readonly TokenTiming[];
  // Live conversion for the input field and the highlighted token.
  readonly view: (m: Matcher, s: MatchState) => EngineView;
  // Token a rejected key is charged to (D10).
  readonly errorTarget: (m: Matcher, s: MatchState) => number;
  // Drops committed prompts and rebases token indices; keystroke indices stay.
  readonly compact: (
    m: Matcher,
    s: MatchState,
  ) => { m: Matcher; s: MatchState; droppedTokens: number };
  // Hint text for a prompt of the window (Esc).
  readonly canonical: (m: Matcher, promptIndex: number) => string;
  // All spellings of a kana in a mode, canonical first; empty for an unknown key.
  readonly spellingsFor: (key: KanaKey, strictness: Strictness) => readonly string[];
  readonly canonicalFor: (key: KanaKey) => string;
};

export function createEngine(table: EngineTable): Engine {
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
