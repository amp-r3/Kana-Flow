import type { KanaRow } from '../types';

export const dakutenRows: readonly KanaRow[] = [
  {
    id: 'g',
    name: 'Ga - Gi - Gu - Ge - Go',
    category: 'dakuten',
    entries: [
      { hiragana: 'が', katakana: 'ガ', ime: ['ga'], learner: [] },
      { hiragana: 'ぎ', katakana: 'ギ', ime: ['gi'], learner: [] },
      { hiragana: 'ぐ', katakana: 'グ', ime: ['gu'], learner: [] },
      { hiragana: 'げ', katakana: 'ゲ', ime: ['ge'], learner: [] },
      { hiragana: 'ご', katakana: 'ゴ', ime: ['go'], learner: [] },
    ],
  },
  {
    id: 'z',
    name: 'Za - Ji - Zu - Ze - Zo',
    category: 'dakuten',
    entries: [
      { hiragana: 'ざ', katakana: 'ザ', ime: ['za'], learner: [] },
      { hiragana: 'じ', katakana: 'ジ', ime: ['ji', 'zi'], learner: [] },
      { hiragana: 'ず', katakana: 'ズ', ime: ['zu'], learner: [] },
      { hiragana: 'ぜ', katakana: 'ゼ', ime: ['ze'], learner: [] },
      { hiragana: 'ぞ', katakana: 'ゾ', ime: ['zo'], learner: [] },
    ],
  },
  {
    id: 'd',
    name: 'Da - Di - Du - De - Do',
    category: 'dakuten',
    entries: [
      { hiragana: 'だ', katakana: 'ダ', ime: ['da'], learner: [] },
      { hiragana: 'ぢ', katakana: 'ヂ', ime: ['di'], learner: ['ji', 'zi', 'dzi'] },
      { hiragana: 'づ', katakana: 'ヅ', ime: ['du'], learner: ['zu', 'dzu'] },
      { hiragana: 'で', katakana: 'デ', ime: ['de'], learner: [] },
      { hiragana: 'ど', katakana: 'ド', ime: ['do'], learner: [] },
    ],
  },
  {
    id: 'b',
    name: 'Ba - Bi - Bu - Be - Bo',
    category: 'dakuten',
    entries: [
      { hiragana: 'ば', katakana: 'バ', ime: ['ba'], learner: [] },
      { hiragana: 'び', katakana: 'ビ', ime: ['bi'], learner: [] },
      { hiragana: 'ぶ', katakana: 'ブ', ime: ['bu'], learner: [] },
      { hiragana: 'べ', katakana: 'ベ', ime: ['be'], learner: [] },
      { hiragana: 'ぼ', katakana: 'ボ', ime: ['bo'], learner: [] },
    ],
  },
  {
    id: 'p',
    name: 'Pa - Pi - Pu - Pe - Po',
    category: 'dakuten',
    entries: [
      { hiragana: 'ぱ', katakana: 'パ', ime: ['pa'], learner: [] },
      { hiragana: 'ぴ', katakana: 'ピ', ime: ['pi'], learner: [] },
      { hiragana: 'ぷ', katakana: 'プ', ime: ['pu'], learner: [] },
      { hiragana: 'ぺ', katakana: 'ペ', ime: ['pe'], learner: [] },
      { hiragana: 'ぽ', katakana: 'ポ', ime: ['po'], learner: [] },
    ],
  },
];
