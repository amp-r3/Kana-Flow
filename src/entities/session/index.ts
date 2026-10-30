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
  initSession,
  setTestConfig,
  startTest,
  recordKeystroke,
  recordPromptResult,
  finishTest,
  resetSession,
} from './model/store';
