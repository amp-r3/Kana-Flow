import { describe, it, expect, beforeEach } from 'vitest';
import {
  startTest,
  recordKeystroke,
  recordMistake,
  recordPromptResult,
  finishTest,
  resetSession,
  phase,
  correctKeystrokes,
  mistakeCount,
  sessionStartedAt,
  metrics,
} from './store';

describe('session store: state transitions, counters and persistence', () => {
  beforeEach(() => {
    resetSession();
  });

  it('manages phase transitions (idle -> running -> finished -> idle)', () => {
    expect(phase.value).toBe('idle');

    startTest(1000);
    expect(phase.value).toBe('running');
    expect(sessionStartedAt.value).toBe(1000);

    recordKeystroke(1200, true);
    recordKeystroke(1400, false);
    recordMistake();

    expect(correctKeystrokes.value).toBe(1);
    expect(mistakeCount.value).toBe(2);

    recordPromptResult({
      key: 'prompt:1',
      startedAt: 1000,
      endedAt: 2000,
      mistakes: 2,
      assisted: true,
      tokenOutcomes: [],
    });

    const m = finishTest(2000);
    expect(phase.value).toBe('finished');
    expect(metrics.value).toEqual(m);
    expect(m.promptsCompleted).toBe(1);
    expect(m.correct).toBe(1);
    expect(m.mistakes).toBe(2);

    resetSession();
    expect(phase.value).toBe('idle');
    expect(correctKeystrokes.value).toBe(0);
    expect(mistakeCount.value).toBe(0);
    expect(metrics.value).toBeNull();
  });
});
