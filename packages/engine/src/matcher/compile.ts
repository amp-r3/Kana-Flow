import type { KanaKey, PromptItem, Script, Strictness } from '../types';
import { SKIP_CHARACTERS, SOKUON_PREFIXES } from '../data/tokens';
import type { Spelling, StreamMatcher, StreamToken, TokenKind } from './types';

type GlyphInfo = {
  readonly kanaKey: KanaKey;
  readonly ime: readonly string[];
  readonly learner: readonly string[];
};

export type GlyphIndex = {
  readonly glyphs: ReadonlyMap<string, GlyphInfo>;
  readonly maxLength: number;
};

type Draft = {
  readonly glyph: string;
  readonly kanaKey: KanaKey | null;
  readonly kind: TokenKind;
  readonly promptIndex: number;
  texts: string[];
};

type Raw = {
  readonly glyph: string;
  readonly kind: TokenKind;
  readonly info: GlyphInfo | null;
};

const VOWELS = 'aiueo';
// Latin consonants a single n may precede, and a sokuon may double: all but n and y.
const CONSONANTS = 'bcdfghjklmpqrstvwxz';

export function buildGlyphIndex(
  table: readonly {
    readonly entries: readonly {
      readonly hiragana?: string;
      readonly katakana: string;
      readonly ime: readonly string[];
      readonly learner: readonly string[];
    }[];
  }[],
): GlyphIndex {
  const glyphs = new Map<string, GlyphInfo>();
  let maxLength = 1;
  for (const row of table) {
    for (const e of row.entries) {
      if (e.hiragana !== undefined) {
        glyphs.set(e.hiragana, {
          kanaKey: `hiragana:${e.hiragana}`,
          ime: e.ime,
          learner: e.learner,
        });
        maxLength = Math.max(maxLength, e.hiragana.length);
      }
      glyphs.set(e.katakana, { kanaKey: `katakana:${e.katakana}`, ime: e.ime, learner: e.learner });
      maxLength = Math.max(maxLength, e.katakana.length);
    }
  }
  return { glyphs, maxLength };
}

function tokenize(index: GlyphIndex, text: string): Raw[] {
  const out: Raw[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text.charAt(i);
    if (ch === 'っ' || ch === 'ッ') {
      out.push({ glyph: ch, kind: 'sokuon', info: null });
      i += 1;
    } else if (ch === 'ー') {
      out.push({ glyph: ch, kind: 'choonpu', info: null });
      i += 1;
    } else if (ch === 'ん' || ch === 'ン') {
      const script: Script = ch === 'ん' ? 'hiragana' : 'katakana';
      out.push({
        glyph: ch,
        kind: 'n',
        info: { kanaKey: `${script}:${ch}`, ime: [], learner: [] },
      });
      i += 1;
    } else if (SKIP_CHARACTERS.has(ch)) {
      out.push({ glyph: ch, kind: 'skip', info: null });
      i += 1;
    } else {
      let matched = false;
      for (let len = Math.min(index.maxLength, text.length - i); len >= 1; len--) {
        const glyph = text.slice(i, i + len);
        const info = index.glyphs.get(glyph);
        if (info !== undefined) {
          out.push({ glyph, kind: 'kana', info });
          i += len;
          matched = true;
          break;
        }
      }
      if (!matched) {
        throw new Error(`Unrepresentable character in prompt: "${ch}" at index ${i} in "${text}"`);
      }
    }
  }
  return out;
}

function unique(texts: readonly string[]): string[] {
  return Array.from(new Set(texts));
}

function kanaTexts(info: GlyphInfo, strictness: Strictness): string[] {
  return unique(strictness === 'ime' ? info.ime : [...info.ime, ...info.learner]);
}

// っ + kana (D22): the first letter of each spelling is doubled (ch gives tch and cch), and the
// xtu/ltu/xtsu/ltsu prefix is accepted before any spelling.
function sokuonTexts(next: readonly string[]): string[] {
  const doubled: string[] = [];
  for (const t of next) {
    if (t.startsWith('ch')) {
      doubled.push(`t${t}`, `c${t}`);
    } else {
      const c = t.charAt(0);
      if (c !== '' && CONSONANTS.includes(c)) doubled.push(`${c}${t}`);
    }
  }
  const prefixed: string[] = [];
  for (const p of SOKUON_PREFIXES) {
    for (const t of next) prefixed.push(`${p}${t}`);
  }
  return unique([...doubled, ...prefixed]);
}

// ー: '-' always; relaxed also the final vowel of the nearest kana token to the left (through ー).
function choonpuTexts(
  drafts: readonly Draft[],
  promptStart: number,
  strictness: Strictness,
): string[] {
  const texts = ['-'];
  if (strictness === 'ime') return texts;
  let j = drafts.length - 1;
  while (j >= promptStart && drafts[j]?.kind === 'choonpu') j--;
  const prev = j >= promptStart ? drafts[j] : undefined;
  if (prev?.kind === 'kana') {
    for (const t of prev.texts) {
      const last = t.charAt(t.length - 1);
      if (VOWELS.includes(last)) texts.push(last);
    }
  }
  return unique(texts);
}

function canFollowBareN(text: string, strictness: Strictness): boolean {
  const c = text.charAt(0);
  if (c !== '' && CONSONANTS.includes(c)) return true;
  return strictness === 'learner' && c === 'n';
}

// The bare-n spelling of ん as seen from the token that follows it: the indices of the following
// spellings it may precede, or null when anything may follow (end of the stream or a skip token).
function bareNext(
  promptIndex: number,
  next: StreamToken | undefined,
  strictness: Strictness,
): readonly number[] | null {
  if (next === undefined || next.kind === 'skip') return null;
  const boundary = next.promptIndex !== promptIndex;
  const permitted: number[] = [];
  next.spellings.forEach((sp, k) => {
    if ((boundary && strictness === 'learner') || canFollowBareN(sp.text, strictness)) {
      permitted.push(k);
    }
  });
  return permitted;
}

export function compileStream(
  index: GlyphIndex,
  prompts: readonly PromptItem[],
  strictness: Strictness,
): StreamMatcher {
  return appendPrompts(index, { tokens: [], promptStarts: [], strictness }, prompts);
}

// Appends prompts to the end of the stream. Existing token and spelling indices do not change, so
// a state made for `m` stays valid: only the bare n of a trailing ん is re-resolved, because the
// context it was waiting for has now arrived. Its spelling keeps its index and may end up with an
// empty set of permitted next spellings.
export function appendPrompts(
  index: GlyphIndex,
  m: StreamMatcher,
  prompts: readonly PromptItem[],
): StreamMatcher {
  if (prompts.length === 0) return m;
  const strictness = m.strictness;
  const firstPrompt = m.promptStarts.length;
  const baseToken = m.tokens.length;
  const drafts: Draft[] = [];
  const promptStarts: number[] = [];

  prompts.forEach((prompt, i) => {
    const promptIndex = firstPrompt + i;
    const raws = tokenize(index, prompt.text);
    const start = drafts.length;
    promptStarts.push(baseToken + start);

    for (let i = 0; i < raws.length; i++) {
      const raw = raws[i];
      if (raw === undefined) continue;
      const draft = ((): Draft => {
        const base = { glyph: raw.glyph, promptIndex };
        if (raw.kind === 'sokuon') {
          const next = raws[i + 1];
          if (next?.kind === 'kana' && next.info !== null) {
            i += 1;
            return {
              ...base,
              glyph: raw.glyph + next.glyph,
              kanaKey: next.info.kanaKey,
              kind: 'kana',
              texts: sokuonTexts(kanaTexts(next.info, strictness)),
            };
          }
          return { ...base, kanaKey: null, kind: 'sokuon', texts: [...SOKUON_PREFIXES] };
        }
        if (raw.kind === 'choonpu') {
          return {
            ...base,
            kanaKey: null,
            kind: 'choonpu',
            texts: choonpuTexts(drafts, start, strictness),
          };
        }
        if (raw.kind === 'n') {
          return { ...base, kanaKey: raw.info?.kanaKey ?? null, kind: 'n', texts: ['nn', "n'"] };
        }
        if (raw.kind === 'skip' || raw.info === null) {
          return { ...base, kanaKey: null, kind: 'skip', texts: [] };
        }
        return {
          ...base,
          kanaKey: raw.info.kanaKey,
          kind: 'kana',
          texts: kanaTexts(raw.info, strictness),
        };
      })();

      // Reading hints (relaxed only) address the prompt's tokens; a merged っX counts as one.
      if (strictness === 'learner' && draft.kind === 'kana') {
        const tokenIndex = drafts.length - start;
        for (const hint of prompt.readingHints ?? []) {
          if (hint.tokenIndex === tokenIndex)
            draft.texts = unique([...draft.texts, ...hint.learner]);
        }
      }
      drafts.push(draft);
    }
  });

  // A single n for ん depends on the next token's spellings, so resolve from the right.
  const fresh: StreamToken[] = new Array<StreamToken>(drafts.length);
  for (let f = drafts.length - 1; f >= 0; f--) {
    const d = drafts[f];
    if (d === undefined) continue;
    const spellings: Spelling[] = d.texts.map((text) => ({ text, next: null }));
    if (d.kind === 'n') {
      const bare = bareNext(d.promptIndex, fresh[f + 1], strictness);
      if (bare === null || bare.length > 0) spellings.push({ text: 'n', next: bare });
    }
    fresh[f] = {
      glyph: d.glyph,
      kanaKey: d.kanaKey,
      kind: d.kind,
      promptIndex: d.promptIndex,
      spellings,
    };
  }

  const old = m.tokens.slice();
  const last = old[baseToken - 1];
  if (last !== undefined && last.kind === 'n') {
    const bare = bareNext(last.promptIndex, fresh[0], strictness) ?? [];
    old[baseToken - 1] = {
      ...last,
      spellings: last.spellings.map((sp) => (sp.text === 'n' ? { text: 'n', next: bare } : sp)),
    };
  }

  return {
    tokens: [...old, ...fresh],
    promptStarts: [...m.promptStarts, ...promptStarts],
    strictness,
  };
}
