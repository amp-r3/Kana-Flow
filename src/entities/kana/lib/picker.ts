import type {
  PracticeSettings,
  PromptItem,
  ContentItem,
  KanaKey,
} from '../model/types';
import { allKanaRows } from '../model/data';
import type { Rng } from '@/shared/lib';

export function buildPool(
  settings: PracticeSettings,
  content?: readonly ContentItem[],
): readonly PromptItem[] {
  if (settings.content === 'words' || settings.content === 'phrases') {
    if (content && content.length > 0) {
      const filtered = content.filter((item) => {
        if (settings.script === 'both') return true;
        return item.script === settings.script;
      });

      if (filtered.length > 0) {
        return filtered.map((item) => ({
          key: item.id,
          text: item.text,
          script: item.script,
          meaning: item.meaning,
          ...(item.readingHints ? { readingHints: item.readingHints } : {}),
        }));
      }
    }
    // Fallback if content pool is empty
  }

  // Single kana pool
  const pool: PromptItem[] = [];
  const selectedRowSet = new Set(settings.rowIds);

  for (const row of allKanaRows) {
    if (!selectedRowSet.has(row.id)) continue;

    const isExtended = row.category === 'extended';

    for (const entry of row.entries) {
      if (entry.hiragana && !isExtended) {
        if (settings.script === 'hiragana' || settings.script === 'both') {
          const key: KanaKey = `hiragana:${entry.hiragana}`;
          pool.push({
            key,
            text: entry.hiragana,
            script: 'hiragana',
          });
        }
      }

      if (settings.script === 'katakana' || settings.script === 'both') {
        const key: KanaKey = `katakana:${entry.katakana}`;
        pool.push({
          key,
          text: entry.katakana,
          script: 'katakana',
        });
      }
    }
  }

  return pool;
}

export function pickPrompt(
  pool: readonly PromptItem[],
  weights: ReadonlyMap<string, number>,
  rng: Rng,
  previousKey: string | null,
): PromptItem {
  if (pool.length === 0) {
    throw new Error('Cannot pick prompt from empty pool');
  }

  if (pool.length === 1) {
    const single = pool[0];
    if (!single) throw new Error('Pool has no items');
    return single;
  }

  // Filter out previous key if pool has more than 1 item
  const candidates = pool.filter((item) => item.key !== previousKey);
  const eligible = candidates.length > 0 ? candidates : pool;

  // Calculate total weight
  let totalWeight = 0;
  for (const item of eligible) {
    const w = weights.get(item.key) ?? 1;
    totalWeight += Math.max(0.01, w);
  }

  let threshold = rng.next() * totalWeight;

  for (const item of eligible) {
    const w = Math.max(0.01, weights.get(item.key) ?? 1);
    if (threshold <= w) {
      return item;
    }
    threshold -= w;
  }

  const fallback = eligible[eligible.length - 1];
  if (!fallback) {
    throw new Error('Failed to select candidate from pool');
  }
  return fallback;
}
