import { describe, it, expect, beforeEach } from 'vitest';
import { TypingController } from './controller';
import {
  phase,
  setTestConfig,
  metrics,
  resetSession,
  correctKeystrokes,
  mistakeCount,
} from '@/entities/session';
import type { Clock, Scheduler, TimeoutHandle } from '@/shared/lib';
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

type ScheduledTask = {
  id: number;
  fn: () => void;
  triggerAt: number;
  interval?: number;
};

class FakeScheduler implements Scheduler {
  private nextId = 1;
  private tasks = new Map<number, ScheduledTask>();

  setTimeout(fn: () => void, ms: number): TimeoutHandle {
    const id = this.nextId++;
    this.tasks.set(id, { id, fn, triggerAt: ms });
    return { id };
  }

  clearTimeout(handle: TimeoutHandle): void {
    if (typeof handle.id === 'number') {
      this.tasks.delete(handle.id);
    }
  }

  setInterval(fn: () => void, ms: number): TimeoutHandle {
    const id = this.nextId++;
    this.tasks.set(id, { id, fn, triggerAt: ms, interval: ms });
    return { id };
  }

  clearInterval(handle: TimeoutHandle): void {
    if (typeof handle.id === 'number') {
      this.tasks.delete(handle.id);
    }
  }

  advance(ms: number): void {
    const toRun: (() => void)[] = [];
    for (const [id, task] of Array.from(this.tasks.entries())) {
      task.triggerAt -= ms;
      if (task.triggerAt <= 0) {
        toRun.push(task.fn);
        if (task.interval !== undefined) {
          task.triggerAt += task.interval;
        } else {
          this.tasks.delete(id);
        }
      }
    }
    for (const fn of toRun) {
      fn();
    }
  }
}

describe('controller: timing, lifecycle and scripted typing sessions', () => {
  let clock: FakeClock;
  let scheduler: FakeScheduler;

  beforeEach(() => {
    resetSession();
    clock = new FakeClock();
    scheduler = new FakeScheduler();
  });

  it('runs scripted session yielding exact metrics with rejected key, reveal, and absorbed trailing n', () => {
    setTestConfig({ kind: 'count', prompts: 10 });
    expect(phase.value).toBe('idle');

    const prompt1: PromptItem = { key: 'word:pan', text: 'パン' };
    const prompt2: PromptItem = { key: 'word:neko', text: 'ねこ' };

    // Queue with 9 copies of prompt2 so 10 prompts total
    const promptQueue: PromptItem[] = [];
    for (let i = 0; i < 9; i++) {
      promptQueue.push(prompt2);
    }

    const controller = new TypingController(() => promptQueue.shift() ?? prompt2, clock, scheduler);

    // Load first prompt: パン
    controller.loadPrompt(prompt1, 'learner');
    expect(controller.currentPrompt.value?.text).toBe('パン');

    // 1. First key 'p' at time 1000 -> starts test, advances phase to running
    clock.currentTime = 1000;
    controller.handleIntent({ kind: 'char', char: 'p' }, 'learner');
    expect(phase.value).toBe('running');
    expect(controller.typedBuffer.value).toBe('p');
    expect(correctKeystrokes.value).toBe(1);

    // 2. Key 'a' at time 1200
    clock.advance(200); // 1200
    controller.handleIntent({ kind: 'char', char: 'a' }, 'learner');
    expect(controller.typedBuffer.value).toBe('pa');
    expect(correctKeystrokes.value).toBe(2);

    // 3. Rejected key 'x' at time 1400 -> shake flag, buffer unchanged
    clock.advance(200); // 1400
    controller.handleIntent({ kind: 'char', char: 'x' }, 'learner');
    expect(controller.isShaking.value).toBe(true);
    expect(controller.typedBuffer.value).toBe('pa');
    expect(mistakeCount.value).toBe(1);

    // Shake flag clears after 280 ms
    scheduler.advance(280);
    expect(controller.isShaking.value).toBe(false);

    // 4. Key 'n' at time 1600 completes prompt 1 (パン)!
    clock.advance(200); // 1600
    controller.handleIntent({ kind: 'char', char: 'n' }, 'learner');
    expect(controller.currentPrompt.value?.text).toBe('ねこ');
    expect(controller.typedBuffer.value).toBe('');

    // 5. User immediately double-taps 'n' at time 1700 (100ms later, <= 250ms absorption window)
    // Swallowed silently as trailing n of previous prompt!
    clock.advance(100); // 1700
    controller.handleIntent({ kind: 'char', char: 'n' }, 'learner');
    expect(controller.typedBuffer.value).toBe(''); // Swallowed! Still empty buffer for ねこ!

    // 6. User presses Esc (reveal) at time 2000
    clock.advance(300); // 2000
    controller.handleIntent({ kind: 'reveal' }, 'learner');
    expect(controller.isAssisted.value).toBe(true);
    expect(mistakeCount.value).toBe(2); // 1 rejected + 1 reveal

    // 7. User types 'neko' to finish prompt 2:
    clock.advance(200); // 2200
    controller.handleIntent({ kind: 'char', char: 'n' }, 'learner');
    clock.advance(200); // 2400
    controller.handleIntent({ kind: 'char', char: 'e' }, 'learner');
    clock.advance(200); // 2600
    controller.handleIntent({ kind: 'char', char: 'k' }, 'learner');
    clock.advance(200); // 2800
    controller.handleIntent({ kind: 'char', char: 'o' }, 'learner');

    // Type prompts 3 through 10 to finish count test automatically:
    for (let p = 3; p <= 10; p++) {
      clock.advance(100);
      controller.handleIntent({ kind: 'char', char: 'n' }, 'learner');
      clock.advance(100);
      controller.handleIntent({ kind: 'char', char: 'e' }, 'learner');
      clock.advance(100);
      controller.handleIntent({ kind: 'char', char: 'k' }, 'learner');
      clock.advance(100);
      controller.handleIntent({ kind: 'char', char: 'o' }, 'learner');
    }

    // Automatically finished on the 10th prompt without calling finishSession()!
    expect(phase.value).toBe('finished');

    // Verify derived metrics:
    const m = metrics.value;
    expect(m).not.toBeNull();
    if (!m) return;

    expect(m.promptsCompleted).toBe(10);
    // Correct keystrokes:
    // Prompt 1: p, a, n = 3
    // Prompt 2: n, e, k, o = 4
    // Prompts 3..10: 8 * 4 = 32
    // Total correct = 39
    expect(m.correct).toBe(39);
    // Mistakes: 1 rejected ('x') + 1 reveal = 2
    expect(m.mistakes).toBe(2);
    // Live counters match computeMetrics derived output
    expect(correctKeystrokes.value).toBe(m.correct);
    expect(mistakeCount.value).toBe(m.mistakes);
  });

  it('count test (10 prompts) auto-finishes on the last prompt without calling finishSession()', () => {
    setTestConfig({ kind: 'count', prompts: 10 });
    const prompt: PromptItem = { key: 'basic:a', text: 'あ' };
    const controller = new TypingController(() => prompt, clock, scheduler);
    controller.loadPrompt(prompt, 'learner');

    // Type 'a' 10 times to complete 10 prompts
    for (let i = 1; i <= 10; i++) {
      clock.advance(100);
      controller.handleIntent({ kind: 'char', char: 'a' }, 'learner');
    }

    // Must be finished automatically without calling finishSession()
    expect(phase.value).toBe('finished');
    expect(metrics.value).not.toBeNull();
    expect(metrics.value?.promptsCompleted).toBe(10);
  });

  it('the shake flag clears after ~280 ms', () => {
    const prompt: PromptItem = { key: 'basic:a', text: 'あ' };
    const controller = new TypingController(() => prompt, clock, scheduler);
    controller.loadPrompt(prompt, 'learner');

    // Rejected keystroke 'z'
    controller.handleIntent({ kind: 'char', char: 'z' }, 'learner');
    expect(controller.isShaking.value).toBe(true);

    // After 200 ms, still shaking
    scheduler.advance(200);
    expect(controller.isShaking.value).toBe(true);

    // After 80 more ms (total 280 ms), shake flag clears
    scheduler.advance(80);
    expect(controller.isShaking.value).toBe(false);
  });

  it('time test ends mid-prompt at deadline with partial prompt keystrokes counted', () => {
    setTestConfig({ kind: 'time', seconds: 15 });
    const prompt1: PromptItem = { key: 'word:pan', text: 'パン' };
    const prompt2: PromptItem = { key: 'word:neko', text: 'ねこ' };

    const controller = new TypingController(() => prompt2, clock, scheduler);
    controller.loadPrompt(prompt1, 'learner');

    // Start at t = 1000
    clock.currentTime = 1000;
    controller.handleIntent({ kind: 'char', char: 'p' }, 'learner');
    expect(phase.value).toBe('running');

    controller.handleIntent({ kind: 'char', char: 'a' }, 'learner');
    controller.handleIntent({ kind: 'char', char: 'n' }, 'learner');
    // Prompt 1 complete: 3 keystrokes accepted, 1 prompt completed

    // Prompt 2 (ねこ): user types 'n' and 'e'
    clock.advance(2000);
    controller.handleIntent({ kind: 'char', char: 'n' }, 'learner');
    controller.handleIntent({ kind: 'char', char: 'e' }, 'learner');
    expect(controller.typedBuffer.value).toBe('ne');

    // Now advance scheduler by 15000 ms -> deadline fires!
    clock.advance(13000); // reaches 15000 ms total test duration
    scheduler.advance(15000);

    // Test finishes mid-prompt!
    expect(phase.value).toBe('finished');

    const m = metrics.value;
    expect(m).not.toBeNull();
    if (!m) return;

    // Completed prompts is exactly 1 (partial prompt does not count as complete)
    expect(m.promptsCompleted).toBe(1);
    // But all keystrokes are counted (3 from prompt 1 + 2 from partial prompt 2 = 5)
    expect(m.correct).toBe(5);
    expect(m.mistakes).toBe(0);
  });

  it('resets everything on restart and changing a setting resets to idle', () => {
    const prompt: PromptItem = { key: 'word:pan', text: 'パン' };
    const controller = new TypingController(() => prompt, clock, scheduler);
    controller.loadPrompt(prompt, 'learner');

    controller.handleIntent({ kind: 'char', char: 'p' }, 'learner');
    expect(phase.value).toBe('running');
    expect(controller.typedBuffer.value).toBe('p');

    // Calling reset() on controller resets state and session to idle
    controller.reset();
    expect(phase.value).toBe('idle');
    expect(controller.typedBuffer.value).toBe('');

    // Changing testConfig also resets to idle
    controller.loadPrompt(prompt, 'learner');
    controller.handleIntent({ kind: 'char', char: 'p' }, 'learner');
    expect(phase.value).toBe('running');

    setTestConfig({ kind: 'time', seconds: 60 });
    expect(phase.value).toBe('idle');
  });

  it('1 Hz ticker updates tickerNow while test is running', () => {
    const prompt: PromptItem = { key: 'word:pan', text: 'パン' };
    const controller = new TypingController(() => prompt, clock, scheduler);
    controller.loadPrompt(prompt, 'learner');

    clock.currentTime = 5000;
    controller.handleIntent({ kind: 'char', char: 'p' }, 'learner');
    expect(controller.tickerNow.value).toBe(5000);

    // 1 second passes:
    clock.advance(1000);
    scheduler.advance(1000);
    expect(controller.tickerNow.value).toBe(6000);

    // Another second passes:
    clock.advance(1000);
    scheduler.advance(1000);
    expect(controller.tickerNow.value).toBe(7000);
  });
});
