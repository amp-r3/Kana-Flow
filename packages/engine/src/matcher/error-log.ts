import type { KanaKey } from '../types';

// Per-token error data and confusion pairs for one test (D10, D11). The matcher is pure and
// records nothing; the caller passes `errorTarget()` as the token index.
export type ErrorLog = {
  // A rejected key: mistakes += 1 and errored = true for the token, and the pair
  // "expected kana → typed character" is stored when the token has a kana key.
  readonly record: (tokenIndex: number, expected: KanaKey | null, typed: string) => void;
  readonly mistakes: (tokenIndex: number) => number;
  readonly errored: (tokenIndex: number) => boolean;
  // expected kana → typed character → count
  readonly confusions: () => ReadonlyMap<KanaKey, ReadonlyMap<string, number>>;
  // After compact(): token indices move down by the number of dropped tokens.
  readonly rebase: (droppedTokens: number) => void;
};

export function createErrorLog(): ErrorLog {
  let mistakes = new Map<number, number>();
  const confusions = new Map<KanaKey, Map<string, number>>();
  return {
    record: (tokenIndex, expected, typed) => {
      mistakes.set(tokenIndex, (mistakes.get(tokenIndex) ?? 0) + 1);
      if (expected === null) return;
      const typedCounts = confusions.get(expected) ?? new Map<string, number>();
      typedCounts.set(typed, (typedCounts.get(typed) ?? 0) + 1);
      confusions.set(expected, typedCounts);
    },
    mistakes: (tokenIndex) => mistakes.get(tokenIndex) ?? 0,
    errored: (tokenIndex) => (mistakes.get(tokenIndex) ?? 0) > 0,
    confusions: () => confusions,
    rebase: (droppedTokens) => {
      const moved = new Map<number, number>();
      for (const [token, count] of mistakes) {
        if (token >= droppedTokens) moved.set(token - droppedTokens, count);
      }
      mistakes = moved;
    },
  };
}
