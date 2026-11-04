import type { RowId } from '@nekotype/engine';

// The basic gojūon rows: the default selection, and the fallback when a selection yields no kana.

export const DEFAULT_BASIC_ROWS: readonly RowId[] = [
  'vowels',
  'k',
  's',
  't',
  'n',
  'h',
  'm',
  'y',
  'r',
  'w_n',
];
