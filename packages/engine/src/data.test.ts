import { describe, it, expect } from 'vitest';
import { allKanaRows, engineTable, standaloneRows, SKIP_CHARACTERS, SOKUON_PREFIXES } from './data';
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

describe('data integrity: standalone kana (D7)', () => {
  const entries = standaloneRows.flatMap((r) => r.entries);

  it('has the spellings of the spec, x-form first, identical in both modes', () => {
    const spellings = new Map(entries.map((e) => [e.katakana, e.ime]));
    expect(spellings.get('ァ')).toEqual(['xa', 'la']);
    expect(spellings.get('ャ')).toEqual(['xya', 'lya']);
    expect(spellings.get('ヮ')).toEqual(['xwa', 'lwa']);
    expect(spellings.get('ヵ')).toEqual(['xka', 'lka']);
    expect(spellings.get('ヶ')).toEqual(['xke', 'lke']);
    expect(spellings.get('ヰ')).toEqual(['wyi']);
    expect(spellings.get('ヱ')).toEqual(['wye']);
    for (const e of entries) expect(e.learner).toEqual([]);
  });

  it('ヵ and ヶ are katakana only; ゕ and ゖ are absent', () => {
    const glyphs = entries.flatMap((e) => [e.hiragana ?? '', e.katakana]).join('');
    expect(entries.find((e) => e.katakana === 'ヵ')?.hiragana).toBeUndefined();
    expect(entries.find((e) => e.katakana === 'ヶ')?.hiragana).toBeUndefined();
    expect(glyphs).not.toMatch(/[ゕゖ]/);
  });

  it('shares no glyph with the selectable rows, so row selection is unchanged', () => {
    const selectable = new Set(
      allKanaRows.flatMap((r) => r.entries.flatMap((e) => [e.hiragana ?? '', e.katakana])),
    );
    for (const e of entries) {
      expect(selectable.has(e.katakana)).toBe(false);
      if (e.hiragana) expect(selectable.has(e.hiragana)).toBe(false);
    }
    expect(engineTable.length).toBe(allKanaRows.length + standaloneRows.length);
  });

  it('skip characters and sokuon prefixes follow the spec', () => {
    for (const ch of '、。，．！？・「」『』（）…〜 　') expect(SKIP_CHARACTERS.has(ch)).toBe(true);
    expect(SKIP_CHARACTERS.has('あ')).toBe(false);
    expect(SOKUON_PREFIXES).toEqual(['xtu', 'ltu', 'xtsu', 'ltsu']);
  });
});
