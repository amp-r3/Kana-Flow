import { describe, it, expect } from 'vitest';
import { createKeyTally } from './key-tally';

describe('key tally: counts keystrokes without keeping them', () => {
  it('starts empty', () => {
    const tally = createKeyTally().snapshot;
    expect(tally).toEqual({
      correct: 0,
      rejected: 0,
      firstAt: undefined,
      lastAt: undefined,
      perSecond: [],
    });
  });

  it('counts accepted and rejected keys and remembers the first and last time', () => {
    const t = createKeyTally();
    t.record(1000, false);
    t.record(1500, true);
    t.record(2200, true);
    expect(t.snapshot).toMatchObject({ correct: 2, rejected: 1, firstAt: 1000, lastAt: 2200 });
  });

  it('puts a key exactly on a second boundary into the earlier second', () => {
    const t = createKeyTally();
    t.record(1000, true); // first key: index 0
    t.record(2000, true); // 1000 ms after the first key: still index 0
    t.record(2001, true); // index 1
    t.record(4500, true); // index 3
    expect(t.snapshot.perSecond).toEqual([2, 1, 0, 1]);
  });

  it('does not count a rejected key in the seconds, even when it is the first key', () => {
    const t = createKeyTally();
    t.record(1000, false);
    t.record(1400, true);
    expect(t.snapshot.perSecond).toEqual([1]);
    expect(t.snapshot.firstAt).toBe(1000);
  });

  it('reset empties it', () => {
    const t = createKeyTally();
    t.record(1000, true);
    t.reset();
    expect(t.snapshot.correct).toBe(0);
    expect(t.snapshot.firstAt).toBeUndefined();
    expect(t.snapshot.perSecond).toEqual([]);
  });

  it('a snapshot is a copy: later keys do not change it', () => {
    const t = createKeyTally();
    t.record(1000, true);
    const before = t.snapshot;
    t.record(1500, true);
    expect(before.correct).toBe(1);
    expect(before.perSecond).toEqual([1]);
  });
});
