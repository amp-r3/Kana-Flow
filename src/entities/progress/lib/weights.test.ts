import { describe, it, expect } from 'vitest';
import {
  computeWeight,
  computeWeights,
  decayStats,
  updateKanaStats,
} from './weights';
import type { KanaStats } from '../model/types';

describe('progress weights and decay', () => {
  it('computes expected weight for unseen kana (~3.0)', () => {
    // Unseen: no stats
    const wUnseen = computeWeight(undefined);
    expect(wUnseen).toBe(3.0);

    const wZero: KanaStats = { a: 0, m: 0, t: 0 };
    expect(computeWeight(wZero)).toBe(3.0);
  });

  it('computes expected weight for strong kana (close to 1.0)', () => {
    // Strong: 30 attempts, 0 mistakes -> weakness = 1 / 32 = 0.03125 -> weight = 1 + 4*0.03125 = 1.125
    const strongStats: KanaStats = { a: 30, m: 0, t: 400 };
    const wStrong = computeWeight(strongStats);
    expect(wStrong).toBeCloseTo(1.125, 3);
    expect(wStrong).toBeLessThan(2.0);
  });

  it('computes expected weight for weak kana (close to 5.0)', () => {
    // Weak: 10 attempts, 10 mistakes -> weakness = 11 / 12 = 0.9167 -> weight = 1 + 4 * 0.9167 = 4.6667
    const weakStats: KanaStats = { a: 10, m: 10, t: 1500 };
    const wWeak = computeWeight(weakStats);
    expect(wWeak).toBeCloseTo(4.667, 3);
    expect(wWeak).toBeGreaterThan(4.0);
  });

  it('decays stats when attempts exceed 50', () => {
    const fresh: KanaStats = { a: 50, m: 20, t: 800 };
    expect(decayStats(fresh)).toEqual({ a: 50, m: 20, t: 800 });

    const needsDecay: KanaStats = { a: 52, m: 20, t: 800 };
    const decayed = decayStats(needsDecay);
    expect(decayed.a).toBe(26);
    expect(decayed.m).toBe(10);
    expect(decayed.t).toBe(800);
  });

  it('updates stats with EMA latency and triggers decay when a > 50', () => {
    const s1 = updateKanaStats(undefined, 0, 500);
    expect(s1.a).toBe(1);
    expect(s1.m).toBe(0);
    expect(s1.t).toBe(500);

    // Update with 1000ms: EMA = 0.7 * 500 + 0.3 * 1000 = 350 + 300 = 650
    const s2 = updateKanaStats(s1, 1, 1000);
    expect(s2.a).toBe(2);
    expect(s2.m).toBe(1);
    expect(s2.t).toBe(650);

    // When 50 -> 51 attempts: decay triggers!
    const highAttempts: KanaStats = { a: 50, m: 10, t: 600 };
    const s51 = updateKanaStats(highAttempts, 0, 600);
    // a becomes 51 -> decayed to 25, m becomes 10 -> decayed to 5
    expect(s51.a).toBe(25);
    expect(s51.m).toBe(5);
  });

  it('computeWeights builds complete weights map for all provided keys', () => {
    const statsMap = new Map<string, KanaStats>([
      ['hiragana:あ', { a: 20, m: 0, t: 400 }],
      ['hiragana:し', { a: 5, m: 5, t: 1200 }],
    ]);

    const keys = ['hiragana:あ', 'hiragana:し', 'hiragana:ん'];
    const weights = computeWeights(statsMap, keys);

    expect(weights.size).toBe(3);
    expect(weights.get('hiragana:あ')).toBeLessThan(2.0); // strong
    expect(weights.get('hiragana:し')).toBeGreaterThan(3.5); // weak
    expect(weights.get('hiragana:ん')).toBe(3.0); // unseen
  });
});
