import { describe, it, expect } from 'vitest';
import { allKanaRows } from './data';
import type { RowId } from './types';

describe('data integrity: rows', () => {
  it('contains exactly 31 rows with unique IDs', () => {
    expect(allKanaRows.length).toBe(31);
    const idSet = new Set(allKanaRows.map((r) => r.id));
    expect(idSet.size).toBe(31);
  });

  it('RowId union equals the rows', () => {
    const expectedRowIds: readonly RowId[] = [
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
      'g',
      'z',
      'd',
      'b',
      'p',
      'ky',
      'sh',
      'ch',
      'ny',
      'hy',
      'my',
      'ry',
      'gy',
      'j',
      'by',
      'py',
      'ext_fa',
      'ext_va',
      'ext_wi',
      'ext_ti',
      'ext_che',
    ];
    const actualRowIds = allKanaRows.map((r) => r.id);
    expect(actualRowIds).toEqual(expectedRowIds);
  });

  it('every entry has an ime spelling with canonical first', () => {
    for (const row of allKanaRows) {
      for (const entry of row.entries) {
        expect(entry.ime.length).toBeGreaterThanOrEqual(1);
        expect(entry.ime[0]).toBeTruthy();
      }
    }
  });

  it('hiragana/katakana parity for non-extended rows', () => {
    for (const row of allKanaRows) {
      if (row.category === 'extended') {
        for (const entry of row.entries) {
          expect(entry.hiragana).toBeUndefined();
          expect(entry.katakana).toBeTruthy();
        }
      } else {
        for (const entry of row.entries) {
          expect(entry.hiragana).toBeTruthy();
          expect(entry.katakana).toBeTruthy();
        }
      }
    }
  });
});
