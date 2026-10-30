import type { KanaStats, ProgressMap } from '../model/types';

export function computeWeakness(stats?: KanaStats): number {
  const a = stats ? stats.a : 0;
  const m = stats ? stats.m : 0;
  return (m + 1) / (a + 2);
}

export function computeWeight(stats?: KanaStats): number {
  return 1 + 4 * computeWeakness(stats);
}

export function computeWeights(
  statsMap: ProgressMap,
  keys: readonly string[],
): Map<string, number> {
  const weights = new Map<string, number>();
  for (const k of keys) {
    const stats = statsMap.get(k);
    weights.set(k, computeWeight(stats));
  }
  return weights;
}

export function decayStats(stats: KanaStats): KanaStats {
  if (stats.a > 50) {
    return {
      a: Math.floor(stats.a / 2),
      m: Math.floor(stats.m / 2),
      t: stats.t,
    };
  }
  return stats;
}

export function updateKanaStats(
  prev: KanaStats | undefined,
  mistakes: number,
  ms: number,
): KanaStats {
  const a = (prev ? prev.a : 0) + 1;
  const m = (prev ? prev.m : 0) + mistakes;
  let t = ms;

  if (prev && prev.t > 0 && ms > 0) {
    // EMA with alpha = 0.3
    t = Math.round(0.7 * prev.t + 0.3 * ms);
  }

  const updated: KanaStats = { a, m, t };
  return decayStats(updated);
}
