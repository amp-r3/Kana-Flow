export type KanaStats = {
  readonly a: number;
  readonly m: number;
  readonly t: number;
};

export type ProgressMap = ReadonlyMap<string, KanaStats>;

export type PersistedProgress = {
  readonly v: 1;
  readonly stats: Record<string, KanaStats>;
};
