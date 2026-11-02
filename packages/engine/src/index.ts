export type {
  RowCategory,
  RowId,
  BasicRowId,
  DakutenRowId,
  YoonRowId,
  ExtendedRowId,
  Script,
  KanaKey,
  KanaEntry,
  KanaRow,
  KanaTable,
  EngineTable,
  StandaloneRow,
  StandaloneRowId,
  ReadingHint,
  PromptItem,
  Strictness,
} from './types';

export type { Engine, Token, Matcher, Position, MatchState } from './engine';
export { createEngine } from './engine';

export { shouldAbsorb } from './absorption';

export {
  basicRows,
  dakutenRows,
  yoonRows,
  extendedRows,
  standaloneRows,
  allKanaRows,
  engineTable,
  SKIP_CHARACTERS,
  SOKUON_PREFIXES,
} from './data';

export { createStreamEngine } from './matcher/engine';
export type { StreamEngine } from './matcher/engine';
export { createErrorLog } from './matcher/error-log';
export type { ErrorLog } from './matcher/error-log';
export type {
  EngineView,
  TokenTiming,
  Spelling,
  StreamMatcher,
  StreamPosition,
  StreamState,
  StreamToken,
  TokenKind,
} from './matcher/types';
