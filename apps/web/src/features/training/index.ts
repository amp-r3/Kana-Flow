export type { KeyIntent, KeyDownEventLike } from './lib/input-adapter';
export { handleKeyDown } from './lib/input-adapter';

export type { KeyboardBindingOptions } from './lib/keyboard';
export { bindKeyboard } from './lib/keyboard';

export type { Session, SessionDeps } from './model/session';
export { createSession } from './model/session';

export type { Trainer, TrainerDeps } from './model/trainer';
export { createTrainer } from './model/trainer';

export type { Phase, TokenOutcome, PromptResult, SessionMetrics } from './model/types';

export { setupSettingsResetWatcher } from './model/settings-watcher';

export type { PromptWeights } from './lib/prompt-weights';
export { createPromptWeights } from './lib/prompt-weights';
