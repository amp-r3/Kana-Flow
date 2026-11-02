import type { KanaKey, PromptItem, Strictness, Script } from '../model/types';
import { allKanaRows } from '../model/data';

export type Token = {
  readonly glyph: string;
  readonly kanaKey: KanaKey | null;
  readonly spellings: readonly string[];
};

export type Matcher = {
  readonly tokens: readonly Token[];
};

export type Position = {
  readonly tokenIndex: number;
  readonly spellingIndex: number;
  readonly charOffset: number;
};

export type MatchState = {
  readonly positions: readonly Position[];
};

// Map each single kana / combo glyph to its entry and kanaKey
type TableEntryInfo = {
  readonly glyph: string;
  readonly kanaKey: KanaKey;
  readonly ime: readonly string[];
  readonly learner: readonly string[];
};

const glyphTable = new Map<string, TableEntryInfo>();
const keyToCanonicalIme = new Map<string, string>();

for (const row of allKanaRows) {
  for (const entry of row.entries) {
    if (entry.hiragana) {
      const hKey: KanaKey = `hiragana:${entry.hiragana}`;
      const hInfo: TableEntryInfo = {
        glyph: entry.hiragana,
        kanaKey: hKey,
        ime: entry.ime,
        learner: entry.learner,
      };
      glyphTable.set(entry.hiragana, hInfo);
      if (entry.ime.length > 0 && entry.ime[0] !== undefined) {
        keyToCanonicalIme.set(hKey, entry.ime[0]);
      }
    }

    const kKey: KanaKey = `katakana:${entry.katakana}`;
    const kInfo: TableEntryInfo = {
      glyph: entry.katakana,
      kanaKey: kKey,
      ime: entry.ime,
      learner: entry.learner,
    };
    glyphTable.set(entry.katakana, kInfo);
    if (entry.ime.length > 0 && entry.ime[0] !== undefined) {
      keyToCanonicalIme.set(kKey, entry.ime[0]);
    }
  }
}

// Digraph combos sorted by length descending (longest first)
const sortedTableGlyphs = Array.from(glyphTable.keys()).sort((a, b) => b.length - a.length);

export function romajiForKey(key: string): string | null {
  return keyToCanonicalIme.get(key) ?? null;
}

type RawToken = {
  glyph: string;
  kanaKey: KanaKey | null;
  ime: readonly string[];
  learner: readonly string[];
  isSokuon?: boolean;
  isChoonpu?: boolean;
  isN?: boolean;
};

function tokenizeText(text: string): RawToken[] {
  const rawTokens: RawToken[] = [];
  let i = 0;

  while (i < text.length) {
    const char = text[i];
    if (char === undefined) break;

    // Check Sokuon っ / ッ
    if (char === 'っ' || char === 'ッ') {
      rawTokens.push({
        glyph: char,
        kanaKey: null,
        ime: ['xtu', 'ltu', 'xtsu'],
        learner: [],
        isSokuon: true,
      });
      i += 1;
      continue;
    }

    // Check Chōonpu ー
    if (char === 'ー') {
      rawTokens.push({
        glyph: 'ー',
        kanaKey: null,
        ime: ['-'],
        learner: [],
        isChoonpu: true,
      });
      i += 1;
      continue;
    }

    // Check ん / ン
    if (char === 'ん' || char === 'ン') {
      const script: Script = char === 'ん' ? 'hiragana' : 'katakana';
      rawTokens.push({
        glyph: char,
        kanaKey: `${script}:${char}`,
        ime: ['nn', "n'"],
        learner: ['n'],
        isN: true,
      });
      i += 1;
      continue;
    }

    // Try longest match from table (digraphs / extended combos)
    let matched = false;
    for (const g of sortedTableGlyphs) {
      if (text.startsWith(g, i)) {
        const info = glyphTable.get(g);
        if (info) {
          rawTokens.push({
            glyph: g,
            kanaKey: info.kanaKey,
            ime: info.ime,
            learner: info.learner,
          });
          i += g.length;
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      throw new Error(`Unrepresentable character in prompt: "${char}" at index ${i} in "${text}"`);
    }
  }

  return rawTokens;
}

export function compile(prompt: PromptItem, strictness: Strictness): Matcher {
  const rawTokens = tokenizeText(prompt.text);
  const finalTokens: Token[] = [];

  for (let i = 0; i < rawTokens.length; i++) {
    const current = rawTokens[i];
    if (!current) continue;

    // Rule 1: Sokuon っ/ッ attaches to next token and doubles first consonant
    if (current.isSokuon) {
      const next = rawTokens[i + 1];
      const nextFirstChar = next ? next.ime[0]?.[0] : undefined;

      const isVowelOrNY =
        nextFirstChar === undefined || ['a', 'i', 'u', 'e', 'o', 'n', 'y'].includes(nextFirstChar);

      if (next && !isVowelOrNY) {
        // Double consonant of next token
        const mergedGlyph = current.glyph + next.glyph;
        const mergedKanaKey = next.kanaKey; // Section 4.5: key of following kana

        // Generate spellings by doubling first consonant
        const mergedIme: string[] = [];
        const mergedLearner: string[] = [];

        // In IME: ch -> tch
        // In Learner: ch -> cch
        for (const sp of next.ime) {
          if (sp.startsWith('ch')) {
            mergedIme.push(`t${sp}`);
            mergedLearner.push(`c${sp}`);
          } else {
            const firstC = sp[0] ?? '';
            mergedIme.push(`${firstC}${sp}`);
          }
        }

        for (const sp of next.learner) {
          if (sp.startsWith('ch')) {
            mergedLearner.push(`c${sp}`);
          } else {
            const firstC = sp[0] ?? '';
            mergedLearner.push(`${firstC}${sp}`);
          }
        }

        const spellings =
          strictness === 'ime'
            ? Array.from(new Set(mergedIme))
            : Array.from(new Set([...mergedIme, ...mergedLearner]));

        finalTokens.push({
          glyph: mergedGlyph,
          kanaKey: mergedKanaKey,
          spellings,
        });

        i += 1; // skip next token since it was merged
        continue;
      }
      // If standalone or followed by vowel/n/y:
      finalTokens.push({
        glyph: current.glyph,
        kanaKey: null,
        spellings: current.ime,
      });
      continue;
    }

    // Rule 2: Chōonpu ー
    if (current.isChoonpu) {
      const prevToken = finalTokens[finalTokens.length - 1];
      const imeSpellings = ['-'];
      const learnerSpellings: string[] = [];

      if (prevToken) {
        // In learner tier, repeat preceding spelling's final vowel
        for (const sp of prevToken.spellings) {
          const lastChar = sp[sp.length - 1];
          if (lastChar && ['a', 'i', 'u', 'e', 'o'].includes(lastChar)) {
            learnerSpellings.push(lastChar);
          }
        }
      }

      const spellings =
        strictness === 'ime'
          ? imeSpellings
          : Array.from(new Set([...imeSpellings, ...learnerSpellings]));

      finalTokens.push({
        glyph: current.glyph,
        kanaKey: null,
        spellings,
      });
      continue;
    }

    // Rule 3: ん/ン
    if (current.isN) {
      const next = rawTokens[i + 1];
      const imeSpellings = ['nn', "n'"];
      const learnerSpellings = ['n'];

      if (next) {
        // Check if every spelling of next token starts with a consonant other than n/y
        const nextSpellings = strictness === 'ime' ? next.ime : [...next.ime, ...next.learner];
        const canUseBareN =
          nextSpellings.length > 0 &&
          nextSpellings.every((sp) => {
            const firstC = sp[0];
            return firstC !== undefined && !['a', 'i', 'u', 'e', 'o', 'n', 'y'].includes(firstC);
          });

        if (canUseBareN) {
          imeSpellings.unshift('n');
        }
      }

      const spellings =
        strictness === 'ime'
          ? Array.from(new Set(imeSpellings))
          : Array.from(new Set([...imeSpellings, ...learnerSpellings]));

      finalTokens.push({
        glyph: current.glyph,
        kanaKey: current.kanaKey,
        spellings,
      });
      continue;
    }

    // Regular kana or digraph
    let spellings =
      strictness === 'ime'
        ? [...current.ime]
        : Array.from(new Set([...current.ime, ...current.learner]));

    // Rule 4: Particles / readings readingHints (learner tier)
    if (strictness === 'learner' && prompt.readingHints) {
      const tokenIdx = finalTokens.length;
      for (const hint of prompt.readingHints) {
        if (hint.tokenIndex === tokenIdx) {
          spellings = Array.from(new Set([...spellings, ...hint.learner]));
        }
      }
    }

    finalTokens.push({
      glyph: current.glyph,
      kanaKey: current.kanaKey,
      spellings,
    });
  }

  return { tokens: finalTokens };
}

export function start(m: Matcher): MatchState {
  if (m.tokens.length === 0) {
    return { positions: [] };
  }

  const firstToken = m.tokens[0];
  if (!firstToken) return { positions: [] };

  const positions: Position[] = [];
  for (let sIdx = 0; sIdx < firstToken.spellings.length; sIdx++) {
    positions.push({
      tokenIndex: 0,
      spellingIndex: sIdx,
      charOffset: 0,
    });
  }

  return { positions };
}

export function step(m: Matcher, s: MatchState, ch: string): MatchState | null {
  const nextPositions: Position[] = [];
  const seen = new Set<string>();

  for (const pos of s.positions) {
    if (pos.tokenIndex >= m.tokens.length) {
      continue; // already complete
    }

    const token = m.tokens[pos.tokenIndex];
    if (!token) continue;

    const spelling = token.spellings[pos.spellingIndex];
    if (!spelling) continue;

    if (spelling[pos.charOffset] === ch) {
      const nextOffset = pos.charOffset + 1;

      if (nextOffset < spelling.length) {
        // Advance within the current token
        const key = `${pos.tokenIndex}:${pos.spellingIndex}:${nextOffset}`;
        if (!seen.has(key)) {
          seen.add(key);
          nextPositions.push({
            tokenIndex: pos.tokenIndex,
            spellingIndex: pos.spellingIndex,
            charOffset: nextOffset,
          });
        }
      } else {
        // Token complete! Transition to next token
        const nextTokenIndex = pos.tokenIndex + 1;

        if (nextTokenIndex < m.tokens.length) {
          const nextToken = m.tokens[nextTokenIndex];
          if (nextToken) {
            for (let j = 0; j < nextToken.spellings.length; j++) {
              const key = `${nextTokenIndex}:${j}:0`;
              if (!seen.has(key)) {
                seen.add(key);
                nextPositions.push({
                  tokenIndex: nextTokenIndex,
                  spellingIndex: j,
                  charOffset: 0,
                });
              }
            }
          }
        } else {
          // Whole prompt complete!
          const key = `${nextTokenIndex}:0:0`;
          if (!seen.has(key)) {
            seen.add(key);
            nextPositions.push({
              tokenIndex: nextTokenIndex,
              spellingIndex: 0,
              charOffset: 0,
            });
          }
        }
      }
    }
  }

  if (nextPositions.length === 0) {
    return null;
  }

  return { positions: nextPositions };
}

export function isComplete(m: Matcher, s: MatchState): boolean {
  if (m.tokens.length === 0) return true;
  return s.positions.some((p) => p.tokenIndex >= m.tokens.length);
}

export function activeTokenIndex(s: MatchState): number {
  if (s.positions.length === 0) return 0;
  return Math.max(...s.positions.map((p) => p.tokenIndex));
}

export function extensions(m: Matcher, s: MatchState): ReadonlySet<string> {
  const ext = new Set<string>();

  if (!isComplete(m, s)) {
    return ext;
  }

  // Look for any live positions that have not yet reached completion
  for (const pos of s.positions) {
    if (pos.tokenIndex < m.tokens.length) {
      const token = m.tokens[pos.tokenIndex];
      if (!token) continue;
      const spelling = token.spellings[pos.spellingIndex];
      if (!spelling) continue;
      const nextChar = spelling[pos.charOffset];
      if (nextChar) {
        ext.add(nextChar);
      }
    }
  }

  return ext;
}

export function canonical(m: Matcher): string {
  return m.tokens.map((t) => t.spellings[0] ?? '').join('');
}
