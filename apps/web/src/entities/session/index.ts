export type {
  TimeTestConfig,
  CountTestConfig,
  TestConfig,
  Phase,
  KeystrokeEvent,
  TokenOutcome,
  PromptResult,
  SessionMetrics,
} from './model/types';

export { computeMetrics } from './lib/metrics';

export {
  DEFAULT_TEST_CONFIG,
  testConfig,
  phase,
  keystrokes,
  promptResults,
  metrics,
  correctKeystrokes,
  mistakeCount,
  sessionStartedAt,
  initSession,
  setTestConfig,
  startTest,
  recordKeystroke,
  recordMistake,
  recordPromptResult,
  finishTest,
  resetSession,
} from './model/store';
