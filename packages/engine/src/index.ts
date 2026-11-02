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
