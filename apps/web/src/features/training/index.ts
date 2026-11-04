export type { KeyIntent } from './lib/input-adapter';

export type { InputSource, InputSourceDeps } from './lib/input-source';
export { createInputSource } from './lib/input-source';

export type { Session, SessionDeps } from './model/session';
export { createSession } from './model/session';

export type { Trainer, TrainerDeps } from './model/trainer';
export { createTrainer } from './model/trainer';

export type { Phase, TokenOutcome, PromptResult, SessionMetrics } from './model/types';

export { setupSettingsResetWatcher } from './model/settings-watcher';

export type { PromptWeights } from './lib/prompt-weights';
export { createPromptWeights } from './lib/prompt-weights';
