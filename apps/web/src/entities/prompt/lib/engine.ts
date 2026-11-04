import { createEngine, createErrorLog, engineTable } from '@nekotype/engine';
import type { KanaKey } from '@nekotype/engine';

export type {
  Token,
  Matcher,
  Position,
  MatchState,
  EngineView,
  TokenTiming,
  ErrorLog,
} from '@nekotype/engine';

const engine = createEngine(engineTable);

export const {
  compile,
  extend,
  start,
  step,
  isComplete,
  committedPrompts,
  committedTimings,
  settledPrompts,
  view,
  errorTarget,
  compact,
  canonical,
  spellingsFor,
  canonicalFor,
} = engine;

export { createErrorLog };

// Statistics are stored under plain strings; this narrows one back to a KanaKey.
export function isKanaKey(value: string): value is KanaKey {
  return value.startsWith('hiragana:') || value.startsWith('katakana:');
}
