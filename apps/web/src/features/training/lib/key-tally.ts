/**
 * Counts the keystrokes of a test without keeping them: accepted and rejected totals, the time of
 * the first and last key, and the accepted keys per second of the test. A keystroke costs O(1) and
 * allocates only when a new second starts. The raw keystroke log is never kept (spec metrics.md).
 */
export type KeyTally = {
  readonly correct: number;
  readonly rejected: number;
  readonly firstAt: number | undefined;
  readonly lastAt: number | undefined;
  // Accepted keys in each second after the first key: index n counts keys with
  // n * 1000 < at - firstAt <= (n + 1) * 1000, and the first key itself falls in index 0.
  readonly perSecond: readonly number[];
};

export type KeyTallyRecorder = {
  record(at: number, accepted: boolean): void;
  reset(): void;
  readonly snapshot: KeyTally;
};

export function createKeyTally(): KeyTallyRecorder {
  let correct = 0;
  let rejected = 0;
  let firstAt: number | undefined = undefined;
  let lastAt: number | undefined = undefined;
  const perSecond: number[] = [];

  return {
    record(at, accepted) {
      if (firstAt === undefined) firstAt = at;
      lastAt = at;
      if (!accepted) {
        rejected += 1;
        return;
      }
      correct += 1;
      const index = Math.max(0, Math.ceil((at - firstAt) / 1000) - 1);
      while (perSecond.length <= index) perSecond.push(0);
      perSecond[index] = (perSecond[index] ?? 0) + 1;
    },
    reset() {
      correct = 0;
      rejected = 0;
      firstAt = undefined;
      lastAt = undefined;
      perSecond.length = 0;
    },
    get snapshot(): KeyTally {
      return { correct, rejected, firstAt, lastAt, perSecond: [...perSecond] };
    },
  };
}
