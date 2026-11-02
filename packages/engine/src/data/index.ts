import type { KanaRow } from '../types';
import { basicRows } from './basic';
import { dakutenRows } from './dakuten';
import { yoonRows } from './yoon';
import { extendedRows } from './extended';

export { basicRows } from './basic';
export { dakutenRows } from './dakuten';
export { yoonRows } from './yoon';
export { extendedRows } from './extended';

export const allKanaRows: readonly KanaRow[] = [
  ...basicRows,
  ...dakutenRows,
  ...yoonRows,
  ...extendedRows,
];
