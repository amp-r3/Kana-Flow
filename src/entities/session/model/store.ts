import { signal } from '@preact/signals';
import type {
  TestConfig,
  Phase,
  KeystrokeEvent,
  PromptResult,
  SessionMetrics,
} from './types';
import { computeMetrics } from '../lib/metrics';
import type { KeyValueStore } from '@/shared/lib';
import { STORAGE_KEYS, isSettings } from '@/shared/lib';

export const DEFAULT_TEST_CONFIG: TestConfig = { kind: 'time', seconds: 30 };

export const testConfig = signal<TestConfig>(DEFAULT_TEST_CONFIG);
export const phase = signal<Phase>('idle');
export const keystrokes = signal<readonly KeystrokeEvent[]>([]);
export const promptResults = signal<readonly PromptResult[]>([]);
export const metrics = signal<SessionMetrics | null>(null);

// Cheap counters for live stats (avoids computing heavy metrics on every keystroke)
export const correctKeystrokes = signal<number>(0);
export const mistakeCount = signal<number>(0);
export const sessionStartedAt = signal<number>(0);

let boundStore: KeyValueStore | null = null;

export function initSession(store: KeyValueStore): void {
  boundStore = store;
  const raw = store.get(STORAGE_KEYS.SETTINGS);
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isSettings(parsed)) {
        testConfig.value = parsed.test;
        return;
      }
    } catch {
      // Fallback to default
    }
  }
  testConfig.value = DEFAULT_TEST_CONFIG;
}

export function setTestConfig(config: TestConfig): void {
  testConfig.value = config;
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
  phase.value = 'running';
  sessionStartedAt.value = startedAt;
  correctKeystrokes.value = 0;
  mistakeCount.value = 0;
  keystrokes.value = [];
  promptResults.value = [];
  metrics.value = null;
}

export function recordKeystroke(at: number, accepted: boolean): void {
  keystrokes.value = [...keystrokes.value, { at, accepted }];
  if (accepted) {
    correctKeystrokes.value += 1;
  } else {
    mistakeCount.value += 1;
  }
}

export function recordMistake(): void {
  mistakeCount.value += 1;
}

export function recordPromptResult(result: PromptResult): void {
  promptResults.value = [...promptResults.value, result];
}

export function finishTest(endTimeMs?: number): SessionMetrics {
  phase.value = 'finished';
  const computed = computeMetrics(keystrokes.value, promptResults.value, endTimeMs);
  metrics.value = computed;
  return computed;
}

export function resetSession(): void {
  phase.value = 'idle';
  sessionStartedAt.value = 0;
  correctKeystrokes.value = 0;
  mistakeCount.value = 0;
  keystrokes.value = [];
  promptResults.value = [];
  metrics.value = null;
}
