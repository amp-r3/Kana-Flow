import { describe, it, expect, beforeEach } from 'vitest';
import { TypingController } from './controller';
import {
  phase,
  setTestConfig,
  metrics,
  resetSession,
} from '@/entities/session';
import type { Clock, Rng } from '@/shared/lib';
import type { PromptItem } from '@/entities/kana';

class FakeClock implements Clock {
  currentTime = 1000;
  now(): number {
    return this.currentTime;
  }
  advance(ms: number): void {
    this.currentTime += ms;
  }
}

class SeededRng implements Rng {
  next(): number {
    return 0.5;
  }
}

describe('controller: scripted typing session with fake clock', () => {
  let clock: FakeClock;
  let rng: SeededRng;
  let controller: TypingController;

  beforeEach(() => {
    resetSession();
    clock = new FakeClock();
    rng = new SeededRng();
    controller = new TypingController(clock, rng);
  });

  it('runs scripted session yielding exact metrics with rejected key, reveal, and absorbed trailing n', () => {
    setTestConfig({ kind: 'count', prompts: 10 });
    expect(phase.value).toBe('idle');

    const prompt1: PromptItem = { key: 'word:pan', text: 'パン' };
    const prompt2: PromptItem = { key: 'word:neko', text: 'ねこ' };

    const promptQueue = [prompt2];
    controller.setNextPromptFn(() => {
      const p = promptQueue.shift();
      return p ?? prompt2;
    });

    // Load first prompt: パン
    controller.loadPrompt(prompt1, 'learner');
    expect(controller.currentPrompt.value?.text).toBe('パン');

    // 1. First key 'p' at time 1000 -> starts test, advances phase to running
    clock.currentTime = 1000;
    controller.handleIntent({ kind: 'char', char: 'p' }, 'learner');
    expect(phase.value).toBe('running');
    expect(controller.typedBuffer.value).toBe('p');

    // 2. Key 'a' at time 1200
    clock.advance(200); // 1200
    controller.handleIntent({ kind: 'char', char: 'a' }, 'learner');
    expect(controller.typedBuffer.value).toBe('pa');

    // 3. Rejected key 'x' at time 1400 -> shake flag, buffer unchanged
    clock.advance(200); // 1400
    controller.handleIntent({ kind: 'char', char: 'x' }, 'learner');
    expect(controller.isShaking.value).toBe(true);
    expect(controller.typedBuffer.value).toBe('pa');

    // 4. Key 'n' at time 1600 -> completes パン!
    clock.advance(200); // 1600
    controller.handleIntent({ kind: 'char', char: 'n' }, 'learner');
    // Prompt advances immediately to ねこ!
    expect(controller.currentPrompt.value?.text).toBe('ねこ');
    expect(controller.typedBuffer.value).toBe('');

    // 5. User immediately double-taps 'n' at time 1700 (100ms later, <= 250ms absorption window)
    // Even though 'n' is valid for 'ねこ', it is absorbed as trailing n of previous prompt!
    clock.advance(100); // 1700
    controller.handleIntent({ kind: 'char', char: 'n' }, 'learner');
    expect(controller.typedBuffer.value).toBe(''); // Swallowed! Still empty buffer for ねこ!

    // 6. User presses Esc (reveal) at time 2000
    clock.advance(300); // 2000
    controller.handleIntent({ kind: 'reveal' }, 'learner');
    expect(controller.isAssisted.value).toBe(true);

    // 7. User types 'neko' to finish prompt 2:
    clock.advance(200); // 2200
    controller.handleIntent({ kind: 'char', char: 'n' }, 'learner');
    expect(controller.typedBuffer.value).toBe('n');

    clock.advance(200); // 2400
    controller.handleIntent({ kind: 'char', char: 'e' }, 'learner');
    expect(controller.typedBuffer.value).toBe('ne');

    clock.advance(200); // 2600
    controller.handleIntent({ kind: 'char', char: 'k' }, 'learner');
    expect(controller.typedBuffer.value).toBe('nek');

    clock.advance(200); // 2800
    controller.handleIntent({ kind: 'char', char: 'o' }, 'learner');

    // Finish session to calculate final metrics
    controller.finishSession();
    expect(phase.value).toBe('finished');

    // Verify exact derived metrics:
    const m = metrics.value;
    expect(m).not.toBeNull();
    if (!m) return;

    // Elapsed: 2800 - 1000 = 1800 ms
    expect(m.elapsedMs).toBe(1800);

    // Keystrokes:
    // Prompt 1: p (1), a (1), x (rej), n (1) -> 3 accepted, 1 rejected.
    // Absorbed 'n' -> not recorded.
    // Prompt 2: n (1), e (1), k (1), o (1) -> 4 accepted.
    // Total correct: 7
    expect(m.correct).toBe(7);

    // Total mistakes: 1 rejected ('x') + 1 assisted (Esc on prompt 2) = 2
    expect(m.mistakes).toBe(2);

    // Accuracy: 7 / (7 + 2) = 7 / 9
    expect(m.accuracy).toBeCloseTo(7 / 9, 4);

    expect(m.promptsCompleted).toBe(2);
    expect(m.bestStreak).toBe(0); // prompt 1 had mistake, prompt 2 assisted
  });
});
