import { describe, it, expect, beforeEach } from 'vitest';
import { TypingController } from './controller';
import {
  phase,
  setTestConfig,
  metrics,
  resetSession,
  correctKeystrokes,
  mistakeCount,
  promptResults,
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

  // Spec D3, A15: ん at the end of a prompt takes its context from the next prompt, so a single n
  // is final only once the next key settles it; the absorption window of the baseline is gone.
  it('runs scripted session yielding exact metrics with rejected key, reveal, and ん resolved by the next prompt', () => {
    setTestConfig({ kind: 'count', prompts: 10 });
    expect(phase.value).toBe('idle');

    const prompt1: PromptItem = { key: 'word:pan', text: 'パン' };
    const prompt2: PromptItem = { key: 'word:neko', text: 'ねこ' };

    const controller = new TypingController(() => prompt2, clock, scheduler);
    controller.loadPrompt(prompt1, 'learner');
    expect(controller.currentPrompt.value?.text).toBe('パン');

    // 1. First key 'p' at time 1000 -> starts test, advances phase to running
    clock.currentTime = 1000;
    controller.handleIntent({ kind: 'char', char: 'p' });
    expect(phase.value).toBe('running');
    expect(controller.typedBuffer.value).toBe('p');
    expect(correctKeystrokes.value).toBe(1);

    // 2. Key 'a' at time 1200
    clock.advance(200); // 1200
    controller.handleIntent({ kind: 'char', char: 'a' });
    expect(controller.typedBuffer.value).toBe('pa');
    expect(correctKeystrokes.value).toBe(2);

    // 3. Rejected key 'x' at time 1400 -> shake flag, buffer unchanged
    clock.advance(200); // 1400
    controller.handleIntent({ kind: 'char', char: 'x' });
    expect(controller.isShaking.value).toBe(true);
    expect(controller.typedBuffer.value).toBe('pa');
    expect(mistakeCount.value).toBe(1);

    // Shake flag clears after 280 ms
    scheduler.advance(280);
    expect(controller.isShaking.value).toBe(false);

    // 4. Key 'n' at time 1600: a bare n reaches the end of パン, so ねこ is shown, but the prompt
    // is not committed yet: the n may still turn out to be the first half of `nn`.
    clock.advance(200); // 1600
    controller.handleIntent({ kind: 'char', char: 'n' });
    expect(controller.currentPrompt.value?.text).toBe('ねこ');
    expect(controller.typedBuffer.value).toBe('');
    expect(promptResults.value).toHaveLength(0);
    expect(phase.value).toBe('running');

    // 5. Second n at time 1700: accepted both as the end of `nn` and as the start of ね. The
    // prompt is now committed in every reading, but the two readings disagree on the keys of ん.
    clock.advance(100); // 1700
    controller.handleIntent({ kind: 'char', char: 'n' });
    expect(controller.typedBuffer.value).toBe('n');
    expect(correctKeystrokes.value).toBe(4);
    expect(promptResults.value).toHaveLength(0);

    // 6. User presses Esc (reveal) at time 2000: charged to the prompt on screen
    clock.advance(300); // 2000
    controller.handleIntent({ kind: 'reveal' });
    expect(controller.isAssisted.value).toBe(true);
    expect(mistakeCount.value).toBe(2); // 1 rejected + 1 reveal

    // 7. 'e' at time 2200 settles it: ん was a bare n. パン is recorded, ended by the key that
    // committed it (time 1700).
    clock.advance(200); // 2200
    controller.handleIntent({ kind: 'char', char: 'e' });
    expect(promptResults.value).toHaveLength(1);
    const first = promptResults.value[0];
    expect(first?.key).toBe('word:pan');
    expect(first?.startedAt).toBe(1000);
    expect(first?.endedAt).toBe(1700);
    expect(first?.mistakes).toBe(1);
    expect(first?.assisted).toBe(false);
    // パ: the first token of the test has no reaction time (spec metrics.md); ン: one key (1600),
    // 400 ms after the previous token, the rejected x included. The second n belongs to ね, not
    // to ん.
    expect(first?.tokenOutcomes).toEqual([
      { kanaKey: 'katakana:パ', mistakes: 0, ms: 0 },
      { kanaKey: 'katakana:ン', mistakes: 1, ms: 400 },
    ]);

    // 8. 'ko' finishes ねこ
    clock.advance(200); // 2400
    controller.handleIntent({ kind: 'char', char: 'k' });
    clock.advance(200); // 2600
    controller.handleIntent({ kind: 'char', char: 'o' });
    expect(promptResults.value).toHaveLength(2);
    expect(promptResults.value[1]?.assisted).toBe(true);

    // Type prompts 3 through 10 to finish count test automatically:
    for (let p = 3; p <= 10; p++) {
      for (const char of 'neko') {
        clock.advance(100);
        controller.handleIntent({ kind: 'char', char });
      }
    }

    // Automatically finished on the 10th prompt without calling finishSession()!
    expect(phase.value).toBe('finished');

    const m = metrics.value;
    expect(m).not.toBeNull();
    if (!m) return;

    expect(m.promptsCompleted).toBe(10);
    // Correct keystrokes: p, a, n, n, e, k, o = 7 for the first two prompts + 8 * 4 = 39
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
      controller.handleIntent({ kind: 'char', char: 'a' });
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
    controller.handleIntent({ kind: 'char', char: 'z' });
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
    controller.handleIntent({ kind: 'char', char: 'p' });
    expect(phase.value).toBe('running');

    controller.handleIntent({ kind: 'char', char: 'a' });
    controller.handleIntent({ kind: 'char', char: 'n' });
    // Prompt 1 complete: 3 keystrokes accepted, 1 prompt completed

    // Prompt 2 (ねこ): user types 'n' and 'e'
    clock.advance(2000);
    controller.handleIntent({ kind: 'char', char: 'n' });
    controller.handleIntent({ kind: 'char', char: 'e' });
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

    controller.handleIntent({ kind: 'char', char: 'p' });
    expect(phase.value).toBe('running');
    expect(controller.typedBuffer.value).toBe('p');

    // Calling reset() on controller resets state and session to idle
    controller.reset();
    expect(phase.value).toBe('idle');
    expect(controller.typedBuffer.value).toBe('');

    // Changing testConfig also resets to idle
    controller.loadPrompt(prompt, 'learner');
    controller.handleIntent({ kind: 'char', char: 'p' });
    expect(phase.value).toBe('running');

    setTestConfig({ kind: 'time', seconds: 60 });
    expect(phase.value).toBe('idle');
  });

  it('1 Hz ticker updates tickerNow while test is running', () => {
    const prompt: PromptItem = { key: 'word:pan', text: 'パン' };
    const controller = new TypingController(() => prompt, clock, scheduler);
    controller.loadPrompt(prompt, 'learner');

    clock.currentTime = 5000;
    controller.handleIntent({ kind: 'char', char: 'p' });
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

describe('controller: prompt stream (spec D3, A15)', () => {
  let clock: FakeClock;
  let scheduler: FakeScheduler;

  beforeEach(() => {
    resetSession();
    clock = new FakeClock();
    scheduler = new FakeScheduler();
  });

  const pan: PromptItem = { key: 'word:pan', text: 'パン' };
  const neko: PromptItem = { key: 'word:neko', text: 'ねこ' };

  function type(controller: TypingController, keys: string): void {
    for (const char of keys) {
      clock.advance(100);
      controller.handleIntent({ kind: 'char', char });
    }
  }

  it('keeps the displayed prompt and two more in the matcher, and asks for no more than a count test needs', () => {
    let asked = 0;
    const supply = (): PromptItem => {
      asked += 1;
      return neko;
    };

    setTestConfig({ kind: 'time', seconds: 30 });
    const open = new TypingController(supply, clock, scheduler);
    open.loadPrompt(neko, 'learner');
    expect(asked).toBe(2);
    type(open, 'neko');
    expect(asked).toBe(3);

    setTestConfig({ kind: 'count', prompts: 10 });
    asked = 0;
    const counted = new TypingController(supply, clock, scheduler);
    counted.loadPrompt(neko, 'learner');
    expect(asked).toBe(2);
    for (let i = 0; i < 10; i++) type(counted, 'neko');
    expect(phase.value).toBe('finished');
    expect(asked).toBe(9);
  });

  it('strict mode needs nn at the end of a prompt before an n: the prompt switches on the second n', () => {
    const controller = new TypingController(() => neko, clock, scheduler);
    controller.loadPrompt(pan, 'ime');
    type(controller, 'pan');
    expect(controller.currentPrompt.value?.text).toBe('パン');
    expect(controller.typedBuffer.value).toBe('pan');
    type(controller, 'n');
    expect(controller.currentPrompt.value?.text).toBe('ねこ');
    expect(promptResults.value).toHaveLength(1);
  });

  it('relaxed mode takes a single n before a vowel prompt: ほん → あめ is `honame`', () => {
    const ame: PromptItem = { key: 'word:ame', text: 'あめ' };
    const hon: PromptItem = { key: 'word:hon', text: 'ほん' };
    const controller = new TypingController(() => ame, clock, scheduler);
    controller.loadPrompt(hon, 'learner');
    type(controller, 'hon');
    expect(controller.currentPrompt.value?.text).toBe('あめ');
    type(controller, 'a');
    expect(promptResults.value).toHaveLength(1);
    expect(promptResults.value[0]?.tokenOutcomes.map((t) => t.kanaKey)).toEqual([
      'hiragana:ほ',
      'hiragana:ん',
    ]);
  });

  it('charges a rejected key to the ん that is still undecided, not to the next prompt (D10)', () => {
    const hon: PromptItem = { key: 'word:hon', text: 'ほん' };
    const controller = new TypingController(() => neko, clock, scheduler);
    controller.loadPrompt(hon, 'learner');
    type(controller, 'hon');
    type(controller, 'x');
    expect(mistakeCount.value).toBe(1);
    type(controller, 'ne');
    expect(promptResults.value).toHaveLength(1);
    expect(promptResults.value[0]?.mistakes).toBe(1);
    expect(promptResults.value[0]?.tokenOutcomes.map((t) => t.mistakes)).toEqual([0, 1]);
  });

  it('an Esc before the first key still counts once the test starts', () => {
    const controller = new TypingController(() => neko, clock, scheduler);
    controller.loadPrompt(neko, 'learner');
    controller.handleIntent({ kind: 'reveal' });
    expect(phase.value).toBe('idle');
    expect(mistakeCount.value).toBe(1);
    type(controller, 'n');
    expect(phase.value).toBe('running');
    expect(mistakeCount.value).toBe(1);
  });

  it('an Esc while the ん of the previous prompt is undecided is charged to the prompt on screen', () => {
    const hon: PromptItem = { key: 'word:hon', text: 'ほん' };
    const controller = new TypingController(() => neko, clock, scheduler);
    controller.loadPrompt(hon, 'learner');
    type(controller, 'hon');
    expect(controller.currentPrompt.value?.text).toBe('ねこ');
    controller.handleIntent({ kind: 'reveal' });
    expect(mistakeCount.value).toBe(1);
    type(controller, 'neko');
    const [first, second] = promptResults.value;
    expect(first?.mistakes).toBe(0);
    expect(first?.assisted).toBe(false);
    expect(second?.mistakes).toBe(1);
    expect(second?.assisted).toBe(true);
    expect(second?.tokenOutcomes.map((t) => t.mistakes)).toEqual([1, 0]);
  });

  it('an Esc skips the leading skip token of the prompt on screen', () => {
    const quoted: PromptItem = { key: 'phrase:q', text: '「ねこ' };
    const controller = new TypingController(() => neko, clock, scheduler);
    controller.loadPrompt(quoted, 'learner');
    controller.handleIntent({ kind: 'reveal' });
    type(controller, 'neko');
    expect(promptResults.value[0]?.mistakes).toBe(1);
  });

  it('a single-kana ん that ends a count test is timed from the previous token, not 1 ms', () => {
    setTestConfig({ kind: 'count', prompts: 10 });
    const a: PromptItem = { key: 'basic:a', text: 'あ' };
    const n: PromptItem = { key: 'basic:n', text: 'ん' };
    let asked = 0;
    const controller = new TypingController(() => (++asked < 9 ? a : n), clock, scheduler);
    controller.loadPrompt(a, 'learner');
    type(controller, 'aaaaaaaaa');
    clock.advance(500);
    type(controller, 'n');
    expect(phase.value).toBe('finished');
    const last = promptResults.value[9];
    expect(last?.key).toBe('basic:n');
    expect(last?.tokenOutcomes[0]?.ms).toBe(600);
    expect(last?.endedAt).toBe(clock.currentTime);
  });

  it('the first token of a test gets no reaction time, even when its timing is ambiguous', () => {
    setTestConfig({ kind: 'time', seconds: 15 });
    const n: PromptItem = { key: 'basic:n', text: 'ん' };
    const controller = new TypingController(() => neko, clock, scheduler);
    controller.loadPrompt(n, 'learner');
    type(controller, 'nn');
    controller.finishSession();
    expect(promptResults.value[0]?.tokenOutcomes[0]?.ms).toBe(0);
  });

  it('records every prompt before compaction drops it, in order and exactly once', () => {
    setTestConfig({ kind: 'time', seconds: 120 });
    const hon: PromptItem = { key: 'word:hon', text: 'ほん' };
    let i = 0;
    const controller = new TypingController(() => (i++ % 2 === 0 ? neko : hon), clock, scheduler);
    controller.loadPrompt(hon, 'learner');
    for (let k = 0; k < 30; k++) type(controller, 'honneko');
    const keys = promptResults.value.map((r) => r.key);
    expect(keys).toHaveLength(60);
    expect(keys.every((key, k) => key === (k % 2 === 0 ? 'word:hon' : 'word:neko'))).toBe(true);
  });

  it('types 100 prompts with ん at the end of prompts, compacting the window on the way', () => {
    setTestConfig({ kind: 'count', prompts: 100 });
    const hon: PromptItem = { key: 'word:hon', text: 'ほん' };
    let i = 0;
    const controller = new TypingController(() => (i++ % 2 === 0 ? neko : hon), clock, scheduler);
    controller.loadPrompt(hon, 'learner');
    let guard = 0;
    while (phase.value !== 'finished' && guard++ < 1000) {
      type(controller, controller.canonicalRomaji.value);
    }
    expect(phase.value).toBe('finished');
    expect(promptResults.value).toHaveLength(100);
    expect(metrics.value?.promptsCompleted).toBe(100);
    const measured = promptResults.value.flatMap((r) => r.tokenOutcomes).slice(1);
    for (const result of promptResults.value) {
      expect(result.mistakes).toBe(0);
      expect(result.tokenOutcomes.length).toBe(2);
    }
    for (const token of measured) expect(token.ms).toBeGreaterThanOrEqual(1);
  });

  it('a count test ends on the last prompt even when it ends in ん', () => {
    setTestConfig({ kind: 'count', prompts: 10 });
    const hon: PromptItem = { key: 'word:hon', text: 'ほん' };
    const controller = new TypingController(() => hon, clock, scheduler);
    controller.loadPrompt(hon, 'learner');
    for (let i = 0; i < 9; i++) type(controller, 'honn');
    expect(phase.value).toBe('running');
    type(controller, 'hon');
    expect(phase.value).toBe('finished');
    expect(promptResults.value).toHaveLength(10);
  });
});
