import type { ReadingHint, RowId, Script, Strictness } from '@nekotype/engine';

export type {
  BasicRowId,
  DakutenRowId,
  ExtendedRowId,
  KanaEntry,
  KanaKey,
  KanaRow,
  PromptItem,
  ReadingHint,
  RowCategory,
  RowId,
  Script,
  Strictness,
  YoonRowId,
} from '@nekotype/engine';

export type ScriptMode = Script | 'both';

export type ContentKind = 'single' | 'words' | 'phrases';

export type ContentItem = {
  readonly id: string;
  readonly text: string;
  readonly script: Script;
  readonly meaning: { readonly en: string; readonly ru: string };
  readonly readingHints?: readonly ReadingHint[];
};

export type PracticeSettings = {
  readonly script: ScriptMode;
  readonly content: ContentKind;
  readonly strictness: Strictness;
  readonly rowIds: readonly RowId[];
  readonly weakFocus: boolean;
};
