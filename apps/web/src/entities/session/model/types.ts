export type Phase = 'idle' | 'running' | 'finished';

export type KeystrokeEvent = {
  readonly at: number;
  readonly accepted: boolean;
};

export type TokenOutcome = {
  readonly kanaKey: string | null;
  readonly mistakes: number;
  readonly ms: number;
};

export type PromptResult = {
  readonly key: string;
  readonly startedAt: number;
  readonly endedAt: number;
  readonly mistakes: number;
  readonly assisted: boolean;
  readonly tokenOutcomes: readonly TokenOutcome[];
};

export type SessionMetrics = {
  readonly elapsedMs: number;
  readonly correct: number;
  readonly mistakes: number;
  readonly wpm: number;
  readonly rawWpm: number;
  readonly accuracy: number;
  readonly kanaPerMin: number;
  readonly bestStreak: number;
  readonly promptsCompleted: number;
  readonly wpmSeries: readonly number[];
};
