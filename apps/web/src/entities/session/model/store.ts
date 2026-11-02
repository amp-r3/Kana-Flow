import type { ReadonlySignal } from '@preact/signals';
import { signal } from '@preact/signals';
import type { TestConfig, Phase, KeystrokeEvent, PromptResult, SessionMetrics } from './types';
import { computeMetrics } from '../lib/metrics';
import type { KeyValueStore } from '@/shared/lib';
import { STORAGE_KEYS, isSettings } from '@/shared/lib';

export const DEFAULT_TEST_CONFIG: TestConfig = { kind: 'time', seconds: 30 };

const _testConfig = signal<TestConfig>(DEFAULT_TEST_CONFIG);
const _phase = signal<Phase>('idle');
const _keystrokes = signal<readonly KeystrokeEvent[]>([]);
const _promptResults = signal<readonly PromptResult[]>([]);
const _metrics = signal<SessionMetrics | null>(null);

// Cheap counters for live stats (avoids computing heavy metrics on every keystroke)
const _correctKeystrokes = signal<number>(0);
const _mistakeCount = signal<number>(0);
const _sessionStartedAt = signal<number>(0);

export const testConfig: ReadonlySignal<TestConfig> = _testConfig;
export const phase: ReadonlySignal<Phase> = _phase;
export const keystrokes: ReadonlySignal<readonly KeystrokeEvent[]> = _keystrokes;
export const promptResults: ReadonlySignal<readonly PromptResult[]> = _promptResults;
export const metrics: ReadonlySignal<SessionMetrics | null> = _metrics;
export const correctKeystrokes: ReadonlySignal<number> = _correctKeystrokes;
export const mistakeCount: ReadonlySignal<number> = _mistakeCount;
export const sessionStartedAt: ReadonlySignal<number> = _sessionStartedAt;

let boundStore: KeyValueStore | null = null;

export function initSession(store: KeyValueStore): void {
  boundStore = store;
  const raw = store.get(STORAGE_KEYS.SETTINGS);
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isSettings(parsed)) {
        _testConfig.value = parsed.test;
        return;
      }
    } catch {
      // Fallback to default
    }
  }
  _testConfig.value = DEFAULT_TEST_CONFIG;
}

export function setTestConfig(config: TestConfig): void {
  _testConfig.value = config;
  resetSession();

  if (boundStore) {
    try {
      const raw = boundStore.get(STORAGE_KEYS.SETTINGS);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      if (isSettings(parsed)) {
        const updated = { ...parsed, test: config };
        boundStore.set(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      } else {
        const defaultSettings = {
          v: 1,
          script: 'both',
          content: 'single',
          strictness: 'learner',
          rowIds: ['vowels', 'k', 's', 't', 'n', 'h', 'm', 'y', 'r', 'w_n'],
          weakFocus: true,
          test: config,
        };
        boundStore.set(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
      }
    } catch {
      // Ignore error
    }
  }
}

export function startTest(startedAt: number): void {
  _phase.value = 'running';
  _sessionStartedAt.value = startedAt;
  _correctKeystrokes.value = 0;
  _mistakeCount.value = 0;
  _keystrokes.value = [];
  _promptResults.value = [];
  _metrics.value = null;
}

export function recordKeystroke(at: number, accepted: boolean): void {
  _keystrokes.value = [..._keystrokes.value, { at, accepted }];
  if (accepted) {
    _correctKeystrokes.value += 1;
  } else {
    _mistakeCount.value += 1;
  }
}

export function recordMistake(): void {
  _mistakeCount.value += 1;
}

export function recordPromptResult(result: PromptResult): void {
  _promptResults.value = [..._promptResults.value, result];
}

export function finishTest(endTimeMs?: number): SessionMetrics {
  _phase.value = 'finished';
  const computed = computeMetrics(_keystrokes.value, _promptResults.value, endTimeMs);
  _metrics.value = computed;
  return computed;
}

export function resetSession(): void {
  _phase.value = 'idle';
  _sessionStartedAt.value = 0;
  _correctKeystrokes.value = 0;
  _mistakeCount.value = 0;
  _keystrokes.value = [];
  _promptResults.value = [];
  _metrics.value = null;
}
