export type { KeyIntent } from './lib/input-adapter';

export type { InputSource, InputSourceDeps } from './lib/input-source';
export { useTestChrome } from './lib/use-test-chrome';
export { TextStream } from './ui/text-stream';
export type { TextStreamProps } from './ui/text-stream';
export { createInputSource } from './lib/input-source';

export type { Session, SessionDeps } from './model/session';
export { createSession } from './model/session';

export type { Trainer, TrainerDeps } from './model/trainer';
export { createTrainer } from './model/trainer';

export type { Phase, TokenOutcome, PromptResult, SessionMetrics } from './model/types';

export type { StreamToken, StreamPrompt, StreamSnapshot, Mistake } from './model/stream';

export { setupSettingsResetWatcher } from './model/settings-watcher';

export type { PromptWeights } from './lib/prompt-weights';
export { createPromptWeights } from './lib/prompt-weights';
