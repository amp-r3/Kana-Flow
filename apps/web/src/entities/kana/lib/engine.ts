import { createEngine } from '@nekotype/engine';
import { allKanaRows } from '../model/data';

export type { Token, Matcher, Position, MatchState } from '@nekotype/engine';

const engine = createEngine(allKanaRows);

export const {
  compile,
  start,
  step,
  isComplete,
  activeTokenIndex,
  extensions,
  canonical,
  romajiForKey,
} = engine;
