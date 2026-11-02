import { describe, expect, it } from 'vitest';
import type { Strictness } from '../types';
import { accepts, acceptsItems, rejectedAt } from './test-util';

type Row = {
  readonly name: string;
  readonly texts: string[];
  readonly relaxed: readonly string[];
  readonly strict: readonly string[];
};

// One row per row of "Accepted input" in docs/spec/engine.md; "same" is written out in full.

const ACCEPTED: readonly Row[] = [
  { name: 'し', texts: ['し'], relaxed: ['shi', 'si'], strict: ['shi', 'si'] },
  { name: 'ち', texts: ['ち'], relaxed: ['chi', 'ti'], strict: ['chi', 'ti'] },
  { name: 'つ', texts: ['つ'], relaxed: ['tsu', 'tu'], strict: ['tsu', 'tu'] },
  { name: 'ふ', texts: ['ふ'], relaxed: ['fu', 'hu'], strict: ['fu', 'hu'] },
  { name: 'じ', texts: ['じ'], relaxed: ['ji', 'zi'], strict: ['ji', 'zi'] },
  { name: 'を', texts: ['を'], relaxed: ['wo', 'o'], strict: ['wo'] },
  { name: 'ぢ', texts: ['ぢ'], relaxed: ['di', 'ji', 'zi', 'dzi'], strict: ['di'] },
  { name: 'づ', texts: ['づ'], relaxed: ['du', 'zu', 'dzu'], strict: ['du'] },
  {
    name: 'ん at the end',
    texts: ['ほん'],
    relaxed: ['hon', 'honn', "hon'"],
    strict: ['hon', 'honn', "hon'"],
  },
  {
    name: 'ん before a consonant',
    texts: ['かんた'],
    relaxed: ['kanta', 'kannta', "kan'ta"],
    strict: ['kanta', 'kannta', "kan'ta"],
  },
  {
    name: 'ん before n',
    texts: ['こんな'],
    relaxed: ['konna', 'konnna', "kon'na"],
    strict: ['konnna', "kon'na"],
  },
  {
    name: 'ん before a vowel',
    texts: ['かんい'],
    relaxed: ['kanni', "kan'i"],
    strict: ['kanni', "kan'i"],
  },
  {
    name: 'ん before y',
    texts: ['ほんや'],
    relaxed: ['honnya', "hon'ya"],
    strict: ['honnya', "hon'ya"],
  },
  {
    name: 'ん across a boundary',
    texts: ['ほん', 'ねこ'],
    relaxed: ['honneko', 'honnneko', "hon'neko"],
    strict: ['honnneko', "hon'neko"],
  },
  {
    name: 'ん before a skip token',
    texts: ['ほん。'],
    relaxed: ['hon', 'honn', "hon'"],
    strict: ['hon', 'honn', "hon'"],
  },
  {
    name: 'merged っ',
    texts: ['きって'],
    relaxed: ['kitte', 'kixtute', 'kiltute', 'kixtsute', 'kiltsute'],
    strict: ['kitte', 'kixtute', 'kiltute', 'kixtsute', 'kiltsute'],
  },
  {
    name: 'っ before ch',
    texts: ['まっちゃ'],
    relaxed: ['maccha', 'matcha', 'mattya', 'maxtucha'],
    strict: ['maccha', 'matcha', 'mattya', 'maxtucha'],
  },
  {
    name: 'っち (D4)',
    texts: ['まっち'],
    relaxed: ['macchi', 'matchi', 'matti'],
    strict: ['macchi', 'matchi', 'matti'],
  },
  {
    name: 'standalone っ',
    texts: ['あっ'],
    relaxed: ['axtu', 'altu', 'axtsu', 'altsu'],
    strict: ['axtu', 'altu', 'axtsu', 'altsu'],
  },
  {
    name: 'っ before ー',
    texts: ['ッー'],
    relaxed: ['xtu-', 'ltu-', 'xtsu-', 'ltsu-'],
    strict: ['xtu-', 'ltu-', 'xtsu-', 'ltsu-'],
  },
  { name: 'yōon', texts: ['きゃ'], relaxed: ['kya'], strict: ['kya'] },
  { name: 'しゃ', texts: ['しゃ'], relaxed: ['sha', 'sya'], strict: ['sha', 'sya'] },
  { name: 'ちゃ', texts: ['ちゃ'], relaxed: ['cha', 'tya', 'cya'], strict: ['cha', 'tya'] },
  { name: 'じゃ', texts: ['じゃ'], relaxed: ['ja', 'zya', 'jya'], strict: ['ja', 'zya', 'jya'] },
  { name: 'small kana', texts: ['ぁ'], relaxed: ['xa', 'la'], strict: ['xa', 'la'] },
  { name: 'small ゃ', texts: ['ゃ'], relaxed: ['xya', 'lya'], strict: ['xya', 'lya'] },
  { name: 'ゎ', texts: ['ゎ'], relaxed: ['xwa', 'lwa'], strict: ['xwa', 'lwa'] },
  { name: 'ヵ', texts: ['ヵ'], relaxed: ['xka', 'lka'], strict: ['xka', 'lka'] },
  { name: 'ヶ', texts: ['ヶ'], relaxed: ['xke', 'lke'], strict: ['xke', 'lke'] },
  { name: 'ゐ', texts: ['ゐ'], relaxed: ['wyi'], strict: ['wyi'] },
  { name: 'ゑ', texts: ['ゑ'], relaxed: ['wye'], strict: ['wye'] },
  { name: 'ファ', texts: ['ファ'], relaxed: ['fa', 'fua', 'huxa'], strict: ['fa'] },
  { name: 'ヴ', texts: ['ヴ'], relaxed: ['vu'], strict: ['vu'] },
  { name: 'ヴァ', texts: ['ヴァ'], relaxed: ['va', 'buxa'], strict: ['va'] },
  { name: 'ウィ', texts: ['ウィ'], relaxed: ['wi', 'whi', 'uxi'], strict: ['wi'] },
  { name: 'ウォ', texts: ['ウォ'], relaxed: ['who', 'wo', 'uxo'], strict: ['who'] },
  { name: 'ティ', texts: ['ティ'], relaxed: ['thi', 'ti', 'texi'], strict: ['thi'] },
  { name: 'トゥ', texts: ['トゥ'], relaxed: ['twu', 'tu', 'toxu'], strict: ['twu'] },
  { name: 'テュ', texts: ['テュ'], relaxed: ['thu', 'texyu'], strict: ['thu'] },
  { name: 'シェ', texts: ['シェ'], relaxed: ['she', 'sye', 'sixe'], strict: ['she'] },
  { name: 'ジェ', texts: ['ジェ'], relaxed: ['je', 'zye', 'jye', 'zixe'], strict: ['je'] },
  { name: 'チェ', texts: ['チェ'], relaxed: ['che', 'tye', 'cye', 'tixe'], strict: ['che'] },
  {
    name: 'ー',
    texts: ['コーヒー'],
    relaxed: ['ko-hi-', 'koohii', 'ko-hii', 'koohi-'],
    strict: ['ko-hi-'],
  },
  { name: 'ー at the start', texts: ['ー'], relaxed: ['-'], strict: ['-'] },
  {
    name: 'ーー looks through ー',
    texts: ['こーー'],
    relaxed: ['ko--', 'kooo', 'ko-o'],
    strict: ['ko--'],
  },
  {
    name: 'ー after ん',
    texts: ['ほんー'],
    relaxed: ['honn-', "hon'-"],
    strict: ['honn-', "hon'-"],
  },
  { name: 'skip token', texts: ['あ、い'], relaxed: ['ai'], strict: ['ai'] },
  { name: 'only skip tokens', texts: ['、。'], relaxed: [''], strict: [''] },
  {
    name: 'ん before を',
    texts: ['ほんを'],
    relaxed: ['honwo', 'honnwo', "hon'wo", 'honno', "hon'o"],
    strict: ['honwo', 'honnwo', "hon'wo"],
  },
  {
    name: 'ん before a vowel across a boundary',
    texts: ['ほん', 'あめ'],
    relaxed: ['honame', 'honname', "hon'ame"],
    strict: ['honname', "hon'ame"],
  },
  { name: 'っっ', texts: ['っっ'], relaxed: ['xtuxtu', 'xtultu'], strict: ['xtuxtu', 'xtultu'] },
  {
    name: 'ん before ん',
    texts: ['ほんん'],
    relaxed: ['honnn', 'honnnn'],
    strict: ['honnn', 'honnnn'],
  },
];

describe('accepted input (docs/spec/engine.md)', () => {
  for (const row of ACCEPTED) {
    for (const mode of ['learner', 'ime'] as const satisfies readonly Strictness[]) {
      const inputs = mode === 'learner' ? row.relaxed : row.strict;
      it(`${row.name}: ${mode === 'learner' ? 'relaxed' : 'strict'}`, () => {
        for (const input of inputs) {
          expect(accepts(row.texts, mode, input), `${row.texts.join('|')} ← ${input}`).toBe(true);
        }
      });
    }
  }

  it('accepts the particle readings from readingHints in relaxed mode only', () => {
    const items = [
      { key: 'k', text: 'こんにちは', readingHints: [{ tokenIndex: 4, learner: ['wa'] }] },
    ];
    expect(acceptsItems(items, 'learner', 'konnichiwa')).toBe(true);
    expect(acceptsItems(items, 'learner', 'konnichiha')).toBe(true);
    expect(acceptsItems(items, 'ime', 'konnnichiha')).toBe(true);
    expect(acceptsItems(items, 'ime', 'konnnichiwa')).toBe(false);
  });
});

type Rejected = {
  readonly mode: Strictness | 'both';
  readonly texts: string[];
  readonly input: string;
  // Index of the key at which the input is rejected.
  readonly at: number;
};

const REJECTED: readonly Rejected[] = [
  { mode: 'both', texts: ['かんい'], input: 'kani', at: 3 },
  { mode: 'both', texts: ['ほんや'], input: 'honya', at: 3 },
  { mode: 'both', texts: ['きゃ'], input: 'kilya', at: 1 },
  { mode: 'both', texts: ['きゃ'], input: 'kixya', at: 1 },
  { mode: 'both', texts: ['あっ', 'たま'], input: 'attama', at: 1 },
  { mode: 'ime', texts: ['こんな'], input: 'konna', at: 4 },
  { mode: 'ime', texts: ['ほん', 'ねこ'], input: 'honneko', at: 4 },
  { mode: 'ime', texts: ['ほん', 'あめ'], input: 'honame', at: 3 },
  { mode: 'ime', texts: ['ほんを'], input: 'honno', at: 4 },
  { mode: 'ime', texts: ['ほんを'], input: "hon'o", at: 4 },
  { mode: 'ime', texts: ['を'], input: 'o', at: 0 },
  { mode: 'ime', texts: ['ぢ'], input: 'ji', at: 0 },
  { mode: 'ime', texts: ['ちゃ'], input: 'cya', at: 1 },
  { mode: 'ime', texts: ['コーヒー'], input: 'koohii', at: 2 },
  { mode: 'ime', texts: ['こんにちは'], input: 'konnnichiwa', at: 9 },
  { mode: 'ime', texts: ['ファ'], input: 'fua', at: 1 },
];

describe('rejected input (docs/spec/engine.md)', () => {
  for (const r of REJECTED) {
    const modes: Strictness[] = r.mode === 'both' ? ['learner', 'ime'] : [r.mode];
    for (const mode of modes) {
      it(`${r.texts.join('|')} ← ${r.input} (${mode}) is rejected at key ${r.at}`, () => {
        expect(rejectedAt(r.texts, mode, r.input)).toBe(r.at);
      });
    }
  }

  it('rejects a key after the stream is complete', () => {
    expect(rejectedAt(['あ'], 'learner', 'aa')).toBe(1);
  });

  it('relaxed still rejects what is invalid in both modes only where the table says so', () => {
    // Relaxed-only inputs of the "Strict only" rows are accepted in relaxed mode.
    expect(accepts(['こんな'], 'learner', 'konna')).toBe(true);
    expect(accepts(['ほん', 'ねこ'], 'learner', 'honneko')).toBe(true);
    expect(accepts(['ほん', 'あめ'], 'learner', 'honame')).toBe(true);
    expect(accepts(['を'], 'learner', 'o')).toBe(true);
    expect(accepts(['ちゃ'], 'learner', 'cya')).toBe(true);
    expect(accepts(['コーヒー'], 'learner', 'koohii')).toBe(true);
  });
});
