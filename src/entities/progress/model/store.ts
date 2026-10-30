import type { ReadonlySignal } from '@preact/signals';
import { signal } from '@preact/signals';
import type { KanaStats, ProgressMap, PersistedProgress } from './types';
import { updateKanaStats } from '../lib/weights';
import type { KeyValueStore } from '@/shared/lib';
import {
  STORAGE_KEYS,
  isProgress,
  createDebouncedSaver,
} from '@/shared/lib';

const _progressStats = signal<ProgressMap>(new Map<string, KanaStats>());
export const progressStats: ReadonlySignal<ProgressMap> = _progressStats;

let boundStore: KeyValueStore | null = null;
let debouncedSaver: ReturnType<typeof createDebouncedSaver> | null = null;

function saveProgressToStore(): void {
  if (!boundStore) return;
  const statsRecord: Record<string, KanaStats> = {};
  for (const [key, stats] of _progressStats.value.entries()) {
    statsRecord[key] = stats;
  }
  const payload: PersistedProgress = {
    v: 1,
    stats: statsRecord,
  };
  boundStore.set(STORAGE_KEYS.PROGRESS, JSON.stringify(payload));
}

export function initProgress(store: KeyValueStore): void {
  boundStore = store;
  debouncedSaver = createDebouncedSaver(saveProgressToStore, 300);

  const raw = store.get(STORAGE_KEYS.PROGRESS);
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isProgress(parsed)) {
        const map = new Map<string, KanaStats>();
        for (const [key, val] of Object.entries(parsed.stats)) {
          map.set(key, val);
        }
        _progressStats.value = map;
      }
    } catch {
      // Fallback silently
    }
  }
}

export function recordTokenOutcomes(
  outcomes: readonly { readonly kanaKey: string | null; readonly mistakes: number; readonly ms: number }[],
): void {
  const current = new Map(_progressStats.value);

  for (const o of outcomes) {
    if (!o.kanaKey) continue;
    const prev = current.get(o.kanaKey);
    const updated = updateKanaStats(prev, o.mistakes, o.ms);
    current.set(o.kanaKey, updated);
  }

  _progressStats.value = current;
  if (debouncedSaver) {
    debouncedSaver.trigger();
  }
}

export function flushProgress(): void {
  if (debouncedSaver) {
    debouncedSaver.flush();
  }
}

export function resetProgress(): void {
  _progressStats.value = new Map();
  if (boundStore) {
    boundStore.remove(STORAGE_KEYS.PROGRESS);
  }
}
