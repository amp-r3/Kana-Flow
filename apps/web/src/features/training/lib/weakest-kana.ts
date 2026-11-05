import { canonicalFor, isKanaKey } from '@/entities/prompt';
import type { PromptResult } from '../model/types';

export type WeakKanaItem = {
  readonly key: string;
  readonly glyph: string;
  readonly romaji: string;
  readonly mistakes: number;
};

const MAX_ITEMS = 5;

/** The kana mistyped most in a test: at most five, the worst first, with their canonical romaji. */
export function weakestKana(results: readonly PromptResult[]): readonly WeakKanaItem[] {
  const mistakes = new Map<string, number>();
  for (const result of results) {
    for (const token of result.tokenOutcomes) {
      if (token.kanaKey && token.mistakes > 0) {
        mistakes.set(token.kanaKey, (mistakes.get(token.kanaKey) ?? 0) + token.mistakes);
      }
    }
  }

  const items: WeakKanaItem[] = [];
  for (const [key, count] of mistakes) {
    const colon = key.indexOf(':');
    items.push({
      key,
      glyph: colon >= 0 ? key.slice(colon + 1) : key,
      romaji: isKanaKey(key) ? canonicalFor(key) : '',
      mistakes: count,
    });
  }
  items.sort((a, b) => b.mistakes - a.mistakes);
  return items.slice(0, MAX_ITEMS);
}
