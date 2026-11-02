import type { KanaRow } from '../types';

export const basicRows: readonly KanaRow[] = [
  {
    id: 'vowels',
    name: 'A - I - U - E - O',
    category: 'basic',
    entries: [
      { hiragana: 'あ', katakana: 'ア', ime: ['a'], learner: [] },
      { hiragana: 'い', katakana: 'イ', ime: ['i'], learner: [] },
      { hiragana: 'う', katakana: 'ウ', ime: ['u'], learner: [] },
      { hiragana: 'え', katakana: 'エ', ime: ['e'], learner: [] },
      { hiragana: 'お', katakana: 'オ', ime: ['o'], learner: [] },
    ],
  },
  {
    id: 'k',
    name: 'Ka - Ki - Ku - Ke - Ko',
    category: 'basic',
    entries: [
      { hiragana: 'か', katakana: 'カ', ime: ['ka'], learner: [] },
      { hiragana: 'き', katakana: 'キ', ime: ['ki'], learner: [] },
      { hiragana: 'く', katakana: 'ク', ime: ['ku'], learner: [] },
      { hiragana: 'け', katakana: 'ケ', ime: ['ke'], learner: [] },
      { hiragana: 'こ', katakana: 'コ', ime: ['ko'], learner: [] },
    ],
  },
  {
    id: 's',
    name: 'Sa - Shi - Su - Se - So',
    category: 'basic',
    entries: [
      { hiragana: 'さ', katakana: 'サ', ime: ['sa'], learner: [] },
      { hiragana: 'し', katakana: 'シ', ime: ['shi', 'si'], learner: [] },
      { hiragana: 'す', katakana: 'ス', ime: ['su'], learner: [] },
      { hiragana: 'せ', katakana: 'セ', ime: ['se'], learner: [] },
      { hiragana: 'そ', katakana: 'ソ', ime: ['so'], learner: [] },
    ],
  },
  {
    id: 't',
    name: 'Ta - Chi - Tsu - Te - To',
    category: 'basic',
    entries: [
      { hiragana: 'た', katakana: 'タ', ime: ['ta'], learner: [] },
      { hiragana: 'ち', katakana: 'チ', ime: ['chi', 'ti'], learner: [] },
      { hiragana: 'つ', katakana: 'ツ', ime: ['tsu', 'tu'], learner: [] },
      { hiragana: 'て', katakana: 'テ', ime: ['te'], learner: [] },
      { hiragana: 'と', katakana: 'ト', ime: ['to'], learner: [] },
    ],
  },
  {
    id: 'n',
    name: 'Na - Ni - Nu - Ne - No',
    category: 'basic',
    entries: [
      { hiragana: 'な', katakana: 'ナ', ime: ['na'], learner: [] },
      { hiragana: 'に', katakana: 'ニ', ime: ['ni'], learner: [] },
      { hiragana: 'ぬ', katakana: 'ヌ', ime: ['nu'], learner: [] },
      { hiragana: 'ね', katakana: 'ネ', ime: ['ne'], learner: [] },
      { hiragana: 'の', katakana: 'ノ', ime: ['no'], learner: [] },
    ],
  },
  {
    id: 'h',
    name: 'Ha - Hi - Fu - He - Ho',
    category: 'basic',
    entries: [
      { hiragana: 'は', katakana: 'ハ', ime: ['ha'], learner: [] },
      { hiragana: 'ひ', katakana: 'ヒ', ime: ['hi'], learner: [] },
      { hiragana: 'ふ', katakana: 'フ', ime: ['fu', 'hu'], learner: [] },
      { hiragana: 'へ', katakana: 'ヘ', ime: ['he'], learner: [] },
      { hiragana: 'ほ', katakana: 'ホ', ime: ['ho'], learner: [] },
    ],
  },
  {
    id: 'm',
    name: 'Ma - Mi - Mu - Me - Mo',
    category: 'basic',
    entries: [
      { hiragana: 'ま', katakana: 'マ', ime: ['ma'], learner: [] },
      { hiragana: 'み', katakana: 'ミ', ime: ['mi'], learner: [] },
      { hiragana: 'む', katakana: 'ム', ime: ['mu'], learner: [] },
      { hiragana: 'め', katakana: 'メ', ime: ['me'], learner: [] },
      { hiragana: 'も', katakana: 'モ', ime: ['mo'], learner: [] },
    ],
  },
  {
    id: 'y',
    name: 'Ya - Yu - Yo',
    category: 'basic',
    entries: [
      { hiragana: 'や', katakana: 'ヤ', ime: ['ya'], learner: [] },
      { hiragana: 'ゆ', katakana: 'ユ', ime: ['yu'], learner: [] },
      { hiragana: 'よ', katakana: 'ヨ', ime: ['yo'], learner: [] },
    ],
  },
  {
    id: 'r',
    name: 'Ra - Ri - Ru - Re - Ro',
    category: 'basic',
    entries: [
      { hiragana: 'ら', katakana: 'ラ', ime: ['ra'], learner: [] },
      { hiragana: 'り', katakana: 'リ', ime: ['ri'], learner: [] },
      { hiragana: 'る', katakana: 'ル', ime: ['ru'], learner: [] },
      { hiragana: 'れ', katakana: 'レ', ime: ['re'], learner: [] },
      { hiragana: 'ろ', katakana: 'ロ', ime: ['ro'], learner: [] },
    ],
  },
  {
    id: 'w_n',
    name: 'Wa - Wo - N',
    category: 'basic',
    entries: [
      { hiragana: 'わ', katakana: 'ワ', ime: ['wa'], learner: [] },
      { hiragana: 'を', katakana: 'ヲ', ime: ['wo'], learner: ['o'] },
      { hiragana: 'ん', katakana: 'ン', ime: ['nn', "n'"], learner: ['n'] },
    ],
  },
];
