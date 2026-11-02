import type { KanaKey, Strictness } from '../types';

// 'kana' covers table entries and merged っX; 'sokuon' is a standalone っ.
export type TokenKind = 'kana' | 'sokuon' | 'n' | 'choonpu' | 'skip';

export type Spelling = {
  readonly text: string;
  // Spelling constraint: indices of the spellings of the immediately following token this
  // spelling may precede. null means any (and, at the end of the stream, nothing follows).
  readonly next: readonly number[] | null;
};

export type StreamToken = {
  readonly glyph: string;
  readonly kanaKey: KanaKey | null;
  readonly kind: TokenKind;
  readonly promptIndex: number;
  readonly spellings: readonly Spelling[];
};

export type StreamMatcher = {
  readonly tokens: readonly StreamToken[];
  // Index in `tokens` of the first token of each prompt.
  readonly promptStarts: readonly number[];
  readonly strictness: Strictness;
};

// A position inside a spelling of a token. offset === text.length means the token is done;
// the position then waits for the first key of the next token. token === -1 is the start.
export type StreamPosition = {
  readonly token: number;
  readonly spelling: number;
  readonly offset: number;
};

export type StreamState = {
  readonly positions: readonly StreamPosition[];
};
