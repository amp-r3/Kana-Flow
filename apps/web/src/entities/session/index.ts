export type {
  Phase,
  KeystrokeEvent,
  TokenOutcome,
  PromptResult,
  SessionMetrics,
} from './model/types';

export { computeMetrics } from './lib/metrics';

export {
  phase,
  keystrokes,
  promptResults,
  metrics,
  correctKeystrokes,
  mistakeCount,
  sessionStartedAt,
  startTest,
  recordKeystroke,
  recordMistake,
  recordPromptResult,
  finishTest,
  resetSession,
} from './model/store';
