import { describe, it, expect, beforeEach } from 'vitest';
import {
  initProgress,
  recordTokenOutcomes,
  flushProgress,
  resetProgress,
  progressStats,
} from './store';
import { MemoryKeyValueStore, STORAGE_KEYS } from '@/shared/lib';

describe('progress store: recording, persistence and reset', () => {
  let store: MemoryKeyValueStore;

  beforeEach(() => {
    store = new MemoryKeyValueStore();
    initProgress(store);
    resetProgress();
  });

  it('records token outcomes, flushes to store, and reloads on init', () => {
    expect(progressStats.value.size).toBe(0);

    // Record outcomes for hiragana:あ and hiragana:い
    recordTokenOutcomes([
      { kanaKey: 'hiragana:あ', mistakes: 0, ms: 450 },
      { kanaKey: 'hiragana:い', mistakes: 1, ms: 700 },
      // null kanaKey (e.g. sokuon standalone or chōonpu) should be ignored
      { kanaKey: null, mistakes: 0, ms: 100 },
    ]);

    expect(progressStats.value.size).toBe(2);
    const sA = progressStats.value.get('hiragana:あ');
    expect(sA?.a).toBe(1);
    expect(sA?.m).toBe(0);
    expect(sA?.t).toBe(450);

    const sI = progressStats.value.get('hiragana:い');
    expect(sI?.a).toBe(1);
    expect(sI?.m).toBe(1);
    expect(sI?.t).toBe(700);

    // Flush to storage
    flushProgress();

    const raw = store.get(STORAGE_KEYS.PROGRESS);
    expect(raw).not.toBeNull();

    // Re-initialize from store
    initProgress(store);
    expect(progressStats.value.size).toBe(2);
    expect(progressStats.value.get('hiragana:あ')?.t).toBe(450);
  });

  it('resetProgress clears in-memory stats and removes storage key', () => {
    recordTokenOutcomes([{ kanaKey: 'hiragana:あ', mistakes: 0, ms: 300 }]);
    flushProgress();
    expect(store.get(STORAGE_KEYS.PROGRESS)).not.toBeNull();

    resetProgress();
    expect(progressStats.value.size).toBe(0);
    expect(store.get(STORAGE_KEYS.PROGRESS)).toBeNull();
  });

  it('corrupted or invalid progress in storage falls back silently to empty map', () => {
    store.set(STORAGE_KEYS.PROGRESS, '{"v": 1, "stats": "corrupted"}');
    initProgress(store);
    expect(progressStats.value.size).toBe(0);
  });
});
