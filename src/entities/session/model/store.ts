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

let boundStore: KeyValueStore | null = null;

export function initSession(store: KeyValueStore): void {
  boundStore = store;
  const raw = store.get(STORAGE_KEYS.SETTINGS);
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isSettings(parsed)) {
        testConfig.value = parsed.test;
      }
    } catch {
      // Fallback to default
    }
  }
}

export function setTestConfig(config: TestConfig): void {
  testConfig.value = config;
  resetSession();

  if (boundStore) {
    try {
      const raw = boundStore.get(STORAGE_KEYS.SETTINGS);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isSettings(parsed)) {
          const updated = { ...parsed, test: config };
          boundStore.set(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
        }
      }
    } catch {
      // Ignore error
    }
  }
}

export function startTest(): void {
  phase.value = 'running';
  keystrokes.value = [];
  promptResults.value = [];
  metrics.value = null;
}

export function recordKeystroke(at: number, accepted: boolean): void {
  keystrokes.value = [...keystrokes.value, { at, accepted }];
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
  keystrokes.value = [];
  promptResults.value = [];
  metrics.value = null;
}
