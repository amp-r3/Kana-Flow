export type RowCategory = 'basic' | 'dakuten' | 'yoon' | 'extended';

export type BasicRowId =
  | 'vowels'
  | 'k'
  | 's'
  | 't'
  | 'n'
  | 'h'
  | 'm'
  | 'y'
  | 'r'
  | 'w_n';

export type DakutenRowId = 'g' | 'z' | 'd' | 'b' | 'p';

export type YoonRowId =
  | 'ky'
  | 'sh'
  | 'ch'
  | 'ny'
  | 'hy'
  | 'my'
  | 'ry'
  | 'gy'
  | 'j'
  | 'by'
  | 'py';

export type ExtendedRowId =
  | 'ext_fa'
  | 'ext_va'
  | 'ext_wi'
  | 'ext_ti'
  | 'ext_che';

export type RowId = BasicRowId | DakutenRowId | YoonRowId | ExtendedRowId;

export type Script = 'hiragana' | 'katakana';
export type ScriptMode = Script | 'both';

export type KanaKey = `${Script}:${string}`;

export type KanaEntry = {
  readonly hiragana?: string;
  readonly katakana: string;
  readonly ime: readonly string[];
  readonly learner: readonly string[];
};

export type KanaRow = {
  readonly id: RowId;
  readonly name: string;
  readonly category: RowCategory;
  readonly entries: readonly KanaEntry[];
};

export type ContentKind = 'single' | 'words' | 'phrases';

export type ReadingHint = {
  readonly tokenIndex: number;
  readonly learner: readonly string[];
};

export type ContentItem = {
  readonly id: string;
  readonly text: string;
  readonly script: Script;
  readonly meaning: { readonly en: string; readonly ru: string };
  readonly readingHints?: readonly ReadingHint[];
};

export type PromptItem = {
  readonly key: string;
  readonly text: string;
  readonly script?: Script;
  readonly meaning?: { readonly en: string; readonly ru: string };
  readonly readingHints?: readonly ReadingHint[];
};

export type Strictness = 'learner' | 'ime';

export type PracticeSettings = {
  readonly script: ScriptMode;
  readonly content: ContentKind;
  readonly strictness: Strictness;
  readonly rowIds: readonly RowId[];
  readonly weakFocus: boolean;
};
