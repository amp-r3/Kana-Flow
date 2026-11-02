// Characters that are rendered in the stream but need no input (spec "Skip token"):
// punctuation, and half-width and full-width spaces.
export const SKIP_CHARACTERS: ReadonlySet<string> = new Set([
  '、',
  '。',
  '，',
  '．',
  '！',
  '？',
  '・',
  '「',
  '」',
  '『',
  '』',
  '（',
  '）',
  '…',
  '〜',
  ' ',
  '　',
]);

// Prefixes that make a sokuon standalone, or precede any spelling (spec D5, D22).
export const SOKUON_PREFIXES: readonly string[] = ['xtu', 'ltu', 'xtsu', 'ltsu'];
