import type { StandaloneRow } from '../types';

// Small kana, ゐ and ゑ (spec D7). They are typed as standalone tokens, belong to no selectable
// row and are not part of `allKanaRows`. ゕ and ゖ are not supported, so ヵ and ヶ are katakana only.
// Each kana has the same spellings in both modes, canonical (x-form) first.
export const standaloneRows: readonly StandaloneRow[] = [
  {
    id: 'small',
    entries: [
      { hiragana: 'ぁ', katakana: 'ァ', ime: ['xa', 'la'], learner: [] },
      { hiragana: 'ぃ', katakana: 'ィ', ime: ['xi', 'li'], learner: [] },
      { hiragana: 'ぅ', katakana: 'ゥ', ime: ['xu', 'lu'], learner: [] },
      { hiragana: 'ぇ', katakana: 'ェ', ime: ['xe', 'le'], learner: [] },
      { hiragana: 'ぉ', katakana: 'ォ', ime: ['xo', 'lo'], learner: [] },
      { hiragana: 'ゃ', katakana: 'ャ', ime: ['xya', 'lya'], learner: [] },
      { hiragana: 'ゅ', katakana: 'ュ', ime: ['xyu', 'lyu'], learner: [] },
      { hiragana: 'ょ', katakana: 'ョ', ime: ['xyo', 'lyo'], learner: [] },
      { hiragana: 'ゎ', katakana: 'ヮ', ime: ['xwa', 'lwa'], learner: [] },
      { katakana: 'ヵ', ime: ['xka', 'lka'], learner: [] },
      { katakana: 'ヶ', ime: ['xke', 'lke'], learner: [] },
    ],
  },
  {
    id: 'archaic',
    entries: [
      { hiragana: 'ゐ', katakana: 'ヰ', ime: ['wyi'], learner: [] },
      { hiragana: 'ゑ', katakana: 'ヱ', ime: ['wye'], learner: [] },
    ],
  },
];
