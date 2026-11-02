import { describe, it, expect, beforeEach } from 'vitest';
import {
  initSession,
  setTestConfig,
  startTest,
  recordKeystroke,
  recordMistake,
  recordPromptResult,
  finishTest,
  resetSession,
  testConfig,
  phase,
  correctKeystrokes,
  mistakeCount,
  sessionStartedAt,
  metrics,
  DEFAULT_TEST_CONFIG,
} from './store';
import { MemoryKeyValueStore, STORAGE_KEYS } from '@/shared/lib';

describe('session store: state transitions, counters and persistence', () => {
  let store: MemoryKeyValueStore;

  beforeEach(() => {
    store = new MemoryKeyValueStore();
    resetSession();
    initSession(store);
  });

  it('manages phase transitions (idle -> running -> finished -> idle)', () => {
    expect(phase.value).toBe('idle');

    startTest(1000);
    expect(phase.value).toBe('running');
    expect(sessionStartedAt.value).toBe(1000);

    recordKeystroke(1200, true);
    recordKeystroke(1400, false);
    recordMistake();

    expect(correctKeystrokes.value).toBe(1);
    expect(mistakeCount.value).toBe(2);

    recordPromptResult({
      key: 'prompt:1',
      startedAt: 1000,
      endedAt: 2000,
      mistakes: 2,
      assisted: true,
      tokenOutcomes: [],
    });

    const m = finishTest(2000);
    expect(phase.value).toBe('finished');
    expect(metrics.value).toEqual(m);
    expect(m.promptsCompleted).toBe(1);
    expect(m.correct).toBe(1);
    expect(m.mistakes).toBe(2);

    resetSession();
    expect(phase.value).toBe('idle');
    expect(correctKeystrokes.value).toBe(0);
    expect(mistakeCount.value).toBe(0);
    expect(metrics.value).toBeNull();
  });

  it('setTestConfig updates config, resets session to idle, and persists', () => {
    startTest(1000);
    expect(phase.value).toBe('running');

    setTestConfig({ kind: 'count', prompts: 50 });
    expect(phase.value).toBe('idle');
    expect(testConfig.value).toEqual({ kind: 'count', prompts: 50 });

    // Verify persistence round-trip
    initSession(store);
    expect(testConfig.value).toEqual({ kind: 'count', prompts: 50 });
  });

  it('corrupted or missing settings fall back silently to default test config', () => {
    store.set(STORAGE_KEYS.SETTINGS, '{invalid json');
    initSession(store);
    expect(testConfig.value).toEqual(DEFAULT_TEST_CONFIG);
  });
});
