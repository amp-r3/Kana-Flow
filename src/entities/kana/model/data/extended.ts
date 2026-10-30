import type { KanaRow } from '../types';

export const extendedRows: readonly KanaRow[] = [
  {
    id: 'ext_fa',
    name: 'Fa - Fi - Fe - Fo',
    category: 'extended',
    entries: [
      { katakana: 'ファ', ime: ['fa'], learner: ['fua', 'huxa'] },
      { katakana: 'フィ', ime: ['fi'], learner: ['fui', 'huxi'] },
      { katakana: 'フェ', ime: ['fe'], learner: ['fue', 'huxe'] },
      { katakana: 'フォ', ime: ['fo'], learner: ['fuo', 'huxo'] },
    ],
  },
  {
    id: 'ext_va',
    name: 'Va - Vi - Vu - Ve - Vo',
    category: 'extended',
    entries: [
      { katakana: 'ヴァ', ime: ['va'], learner: ['buxa'] },
      { katakana: 'ヴィ', ime: ['vi'], learner: ['buxi'] },
      { katakana: 'ヴ', ime: ['vu'], learner: [] },
      { katakana: 'ヴェ', ime: ['ve'], learner: ['buxe'] },
      { katakana: 'ヴォ', ime: ['vo'], learner: ['buxo'] },
    ],
  },
  {
    id: 'ext_wi',
    name: 'Wi - We - Who (Wo)',
    category: 'extended',
    entries: [
      { katakana: 'ウィ', ime: ['wi'], learner: ['whi', 'uxi'] },
      { katakana: 'ウェ', ime: ['we'], learner: ['whe', 'uxe'] },
      { katakana: 'ウォ', ime: ['who'], learner: ['wo', 'uxo'] },
    ],
  },
  {
    id: 'ext_ti',
    name: 'Thi - Twu - Dhi - Dwu - Thu - Dhu',
    category: 'extended',
    entries: [
      { katakana: 'ティ', ime: ['thi'], learner: ['ti', 'texi'] },
      { katakana: 'トゥ', ime: ['twu'], learner: ['tu', 'toxu'] },
      { katakana: 'ディ', ime: ['dhi'], learner: ['di', 'dexi'] },
      { katakana: 'ドゥ', ime: ['dwu'], learner: ['du', 'doxu'] },
      { katakana: 'テュ', ime: ['thu'], learner: ['texyu'] },
      { katakana: 'デュ', ime: ['dhu'], learner: ['dexyu'] },
    ],
  },
  {
    id: 'ext_che',
    name: 'She - Je - Che',
    category: 'extended',
    entries: [
      { katakana: 'シェ', ime: ['she'], learner: ['sye', 'sixe'] },
      { katakana: 'ジェ', ime: ['je'], learner: ['zye', 'jye', 'zixe'] },
      { katakana: 'チェ', ime: ['che'], learner: ['tye', 'cye', 'tixe'] },
    ],
  },
];
