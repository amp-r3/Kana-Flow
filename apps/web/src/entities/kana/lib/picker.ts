import type {
  PracticeSettings,
  PromptItem,
  ContentItem,
  KanaKey,
  RowId,
  ScriptMode,
} from '../model/types';
import { allKanaRows } from '../model/data';
import { DEFAULT_BASIC_ROWS } from '../model/default-rows';
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

  const pool = buildKanaPool(settings.script, settings.rowIds);
  if (pool.length > 0) return pool;

  // D20: the selected rows give no kana for this script (extended rows hold katakana only,
  // so katakana + ext rows, then a switch to hiragana). Fall back to the basic rows instead of
  // leaving pickPrompt with an empty pool. The user's row selection is not changed.
  return buildKanaPool(settings.script, DEFAULT_BASIC_ROWS);
}

function buildKanaPool(script: ScriptMode, rowIds: readonly RowId[]): readonly PromptItem[] {
  const pool: PromptItem[] = [];
  const selectedRowSet = new Set(rowIds);

  for (const row of allKanaRows) {
    if (!selectedRowSet.has(row.id)) continue;

    const isExtended = row.category === 'extended';

    for (const entry of row.entries) {
      if (entry.hiragana && !isExtended) {
        if (script === 'hiragana' || script === 'both') {
          const key: KanaKey = `hiragana:${entry.hiragana}`;
          pool.push({ key, text: entry.hiragana, script: 'hiragana' });
        }
      }

      if (script === 'katakana' || script === 'both') {
        const key: KanaKey = `katakana:${entry.katakana}`;
        pool.push({ key, text: entry.katakana, script: 'katakana' });
      }
    }
  }

  return pool;
}

/** True when the selected rows give at least one kana for the script. */
export function rowsYieldKana(settings: Pick<PracticeSettings, 'script' | 'rowIds'>): boolean {
  return buildKanaPool(settings.script, settings.rowIds).length > 0;
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
