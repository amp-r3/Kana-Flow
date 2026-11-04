import type { ReadonlySignal } from '@preact/signals';
import { signal } from '@preact/signals';
import type { KeyIntent } from '../lib/input-adapter';
import type {
  EngineView,
  ErrorLog,
  MatchState,
  Matcher,
  PromptItem,
  Strictness,
  TokenTiming,
} from '@/entities/prompt';
import {
  canonical,
  committedPrompts,
  committedTimings,
  compact,
  compile,
  createErrorLog,
  errorTarget,
  extend,
  isComplete,
  settledPrompts,
  start,
  step,
  view,
} from '@/entities/prompt';
import {
  phase,
  startTest,
  recordKeystroke,
  recordMistake,
  recordPromptResult,
  finishTest,
  resetSession,
} from '@/entities/session';
import { testConfig } from '@/entities/settings';
import { recordTokenOutcomes, flushProgress } from '@/entities/stats';
import type { Clock, Scheduler, TimeoutHandle } from '@/shared/lib';
import { defaultClock, defaultScheduler } from '@/shared/lib';

// Prompts kept in the matcher beyond the displayed one, so the context of a non-final ん is known
// before it is typed (spec "Window").
const LOOKAHEAD = 2;
// Committed prompts after which the matcher drops them (spec "Window").
const COMPACT_EVERY = 20;

/**
 * Types a stream of prompts. The matcher holds a window of the displayed prompt and the next ones;
 * the next prompt is displayed as soon as the live conversion reaches the end of the current one,
 * and a result is recorded when `committedPrompts()` includes the prompt (spec D3, A15).
 *
 * Prompts are numbered from the start of the test ("absolute"); the matcher numbers them from the
 * first prompt of its window ("local"), which moves when `compact()` drops committed prompts.
 */
export class TypingController {
  private readonly _typedBuffer = signal<string>('');
  private readonly _isShaking = signal<boolean>(false);
  private readonly _isAssisted = signal<boolean>(false);
  private readonly _imeNotice = signal<boolean>(false);
  private readonly _currentPrompt = signal<PromptItem | null>(null);
  private readonly _activeTokenIdx = signal<number>(0);
  private readonly _canonicalRomaji = signal<string>('');
  private readonly _tickerNow = signal<number>(0);

  readonly typedBuffer: ReadonlySignal<string> = this._typedBuffer;
  readonly isShaking: ReadonlySignal<boolean> = this._isShaking;
  readonly isAssisted: ReadonlySignal<boolean> = this._isAssisted;
  readonly imeNotice: ReadonlySignal<boolean> = this._imeNotice;
  readonly currentPrompt: ReadonlySignal<PromptItem | null> = this._currentPrompt;
  readonly activeTokenIdx: ReadonlySignal<number> = this._activeTokenIdx;
  readonly canonicalRomaji: ReadonlySignal<string> = this._canonicalRomaji;
  readonly tickerNow: ReadonlySignal<number> = this._tickerNow;

  private matcher: Matcher | null = null;
  private matchState: MatchState | null = null;

  private readonly nextPrompt: () => PromptItem;
  private readonly clock: Clock;
  private readonly scheduler: Scheduler;

  // The prompts of the matcher's window, in order.
  private prompts: PromptItem[] = [];
  // Absolute number of the first prompt of the window.
  private promptBase = 0;
  // Absolute number of the prompt on screen.
  private displayed = 0;
  // Absolute count of prompts whose result is recorded.
  private recorded = 0;
  // Absolute count of prompts seen as committed, and when each one was.
  private committedSeen = 0;
  private readonly committedAt = new Map<number, number>();
  private readonly assisted = new Set<number>();
  private errorLog: ErrorLog = createErrorLog();
  // Time of every accepted keystroke, indexed like the engine's keystroke indices.
  private keyTimes: number[] = [];
  // When the last recorded token ended; undefined until one is recorded.
  private lastTokenEnd: number | undefined = undefined;
  // Mistakes made by Esc before the test started; startTest resets the counters.
  private mistakesBeforeStart = 0;

  private deadlineTimeoutHandle: TimeoutHandle | null = null;
  private tickerIntervalHandle: TimeoutHandle | null = null;
  private shakeTimeoutHandle: TimeoutHandle | null = null;

  constructor(
    nextPrompt: () => PromptItem,
    clock: Clock = defaultClock,
    scheduler: Scheduler = defaultScheduler,
  ) {
    this.nextPrompt = nextPrompt;
    this.clock = clock;
    this.scheduler = scheduler;
  }

  loadPrompt(prompt: PromptItem, strictness: Strictness): void {
    this.prompts = [prompt];
    this.promptBase = 0;
    this.displayed = 0;
    this.recorded = 0;
    this.committedSeen = 0;
    this.committedAt.clear();
    this.assisted.clear();
    this.errorLog = createErrorLog();
    this.keyTimes = [];
    this.lastTokenEnd = undefined;
    this.mistakesBeforeStart = 0;
    const matcher = compile([prompt], strictness);
    const state = start(matcher);
    this.matcher = matcher;
    this.matchState = state;
    this._isShaking.value = false;
    this.fillWindow();
    this.showPrompt(view(matcher, state));
  }

  handleCompositionStart(): void {
    this._imeNotice.value = true;
  }

  handleCompositionEnd(): void {
    this._imeNotice.value = false;
  }

  handleIntent(intent: KeyIntent): void {
    if (phase.value === 'finished' || intent.kind === 'ignore') {
      return;
    }
    const matcher = this.matcher;
    const state = this.matchState;
    if (matcher === null || state === null) {
      return;
    }

    const now = this.clock.now();

    // Reveal intent (Esc): counts one mistake, the prompt must still be typed in full
    if (intent.kind === 'reveal') {
      if (!this.assisted.has(this.displayed)) {
        this.assisted.add(this.displayed);
        this._isAssisted.value = true;
        this.errorLog.record(errorTarget(matcher, state), null, '');
        if (phase.value === 'idle') this.mistakesBeforeStart += 1;
        recordMistake();
      }
      return;
    }

    // First typed letter starts the test if idle
    if (phase.value === 'idle') {
      this.beginTest(now);
    }

    const next = step(matcher, state, intent.char);
    if (next === null) {
      this.reject(matcher, state, intent.char, now);
      return;
    }

    recordKeystroke(now, true);
    this.keyTimes.push(now);
    this.matchState = next;
    this._typedBuffer.value += intent.char;
    this.afterAccepted(matcher, next, now);
  }

  finishSession(): void {
    if (this.matcher !== null && this.matchState !== null && phase.value === 'running') {
      this.flushResults(this.promptBase + committedPrompts(this.matcher, this.matchState));
    }
    this.clearTimers();
    finishTest(this.clock.now());
    flushProgress();
  }

  reset(): void {
    this.clearTimers();
    this.matcher = null;
    this.matchState = null;
    this.prompts = [];
    this.keyTimes = [];
    this.committedAt.clear();
    this.assisted.clear();
    this._typedBuffer.value = '';
    this._isShaking.value = false;
    this._isAssisted.value = false;
    this._imeNotice.value = false;
    this._activeTokenIdx.value = 0;
    this._canonicalRomaji.value = '';
    resetSession();
  }

  private beginTest(now: number): void {
    startTest(now);
    for (let i = 0; i < this.mistakesBeforeStart; i++) {
      recordMistake();
    }

    // If time test, arm deadline timer
    const config = testConfig.value;
    if (config.kind === 'time') {
      this.deadlineTimeoutHandle = this.scheduler.setTimeout(() => {
        this.finishSession();
      }, config.seconds * 1000);
    }

    // 1 Hz ticker for live stats
    this._tickerNow.value = now;
    this.tickerIntervalHandle = this.scheduler.setInterval(() => {
      this._tickerNow.value = this.clock.now();
    }, 1000);
  }

  // Rejected: does not enter the buffer, triggers a shake, is charged to errorTarget() (D10, A34).
  private reject(matcher: Matcher, state: MatchState, char: string, now: number): void {
    recordKeystroke(now, false);
    const target = errorTarget(matcher, state);
    this.errorLog.record(target, matcher.tokens[target]?.kanaKey ?? null, char);

    this._isShaking.value = true;
    if (this.shakeTimeoutHandle) {
      this.scheduler.clearTimeout(this.shakeTimeoutHandle);
    }
    this.shakeTimeoutHandle = this.scheduler.setTimeout(() => {
      this._isShaking.value = false;
      this.shakeTimeoutHandle = null;
    }, 280);
  }

  private afterAccepted(matcher: Matcher, state: MatchState, now: number): void {
    const localCommitted = committedPrompts(matcher, state);
    const committed = this.promptBase + localCommitted;
    for (let k = this.committedSeen; k < committed; k++) {
      this.committedAt.set(k, now);
    }
    this.committedSeen = Math.max(this.committedSeen, committed);
    // Settled prompts only: a ん resolved by the next prompt's first key is not inflated.
    if (this.recorded < committed) {
      this.flushResults(this.promptBase + settledPrompts(matcher, state));
    }

    // The last prompt of a count test ends it as soon as the stream is complete.
    if (this.isFinalStream() && isComplete(matcher, state)) {
      this.flushResults(this.promptBase + this.prompts.length);
      this.finishSession();
      return;
    }

    // Move to the next prompt when the live conversion has reached it.
    const v = view(matcher, state);
    const last = matcher.tokens.length - 1;
    const local = matcher.tokens[Math.min(v.displayedTokens, last)]?.promptIndex ?? 0;
    if (this.promptBase + local > this.displayed) {
      this.displayed = this.promptBase + local;
      this.fillWindow();
      this.showPrompt(v);
    } else {
      this.updateActiveToken(v);
    }

    this.compactIfDue(localCommitted);
  }

  private promptLimit(): number {
    const config = testConfig.value;
    return config.kind === 'count' ? config.prompts : Number.POSITIVE_INFINITY;
  }

  private isFinalStream(): boolean {
    return this.promptBase + this.prompts.length >= this.promptLimit();
  }

  // Keeps the displayed prompt and LOOKAHEAD more in the matcher, up to the end of a count test.
  private fillWindow(): void {
    if (this.matcher === null) return;
    const want = Math.min(this.promptLimit(), this.displayed + 1 + LOOKAHEAD);
    const more: PromptItem[] = [];
    while (this.promptBase + this.prompts.length + more.length < want) {
      more.push(this.nextPrompt());
    }
    if (more.length > 0) {
      this.prompts.push(...more);
      this.matcher = extend(this.matcher, more);
    }
  }

  private showPrompt(v: EngineView): void {
    const matcher = this.matcher;
    const local = this.displayed - this.promptBase;
    this._currentPrompt.value = this.prompts[local] ?? null;
    this._canonicalRomaji.value = matcher === null ? '' : canonical(matcher, local);
    this._isAssisted.value = this.assisted.has(this.displayed);
    this._typedBuffer.value = '';
    this.updateActiveToken(v);
  }

  private updateActiveToken(v: EngineView): void {
    const first = this.matcher?.promptStarts[this.displayed - this.promptBase] ?? 0;
    this._activeTokenIdx.value = Math.max(0, v.activeToken - first);
  }

  /**
   * Records the results of the prompts before `upTo` (absolute), in order. While a test runs that
   * is the settled prompts; at its end, every committed prompt or the whole window, and a token
   * whose timing is still ambiguous is estimated to end at the last key.
   */
  private flushResults(upTo: number): void {
    const matcher = this.matcher;
    const state = this.matchState;
    if (matcher === null || state === null || this.recorded >= upTo) return;
    const now = this.keyTimes.at(-1) ?? this.clock.now();

    const timings = new Map<number, TokenTiming>();
    for (const t of committedTimings(matcher, state)) timings.set(t.tokenIndex, t);

    while (this.recorded < upTo) {
      const local = this.recorded - this.promptBase;
      const from = matcher.promptStarts[local] ?? 0;
      const to = matcher.promptStarts[local + 1] ?? matcher.tokens.length;
      const real: number[] = [];
      for (let t = from; t < to; t++) {
        if (matcher.tokens[t]?.kind !== 'skip') real.push(t);
      }

      const endedAt = this.committedAt.get(this.recorded) ?? now;
      const tokenOutcomes: { kanaKey: string | null; mistakes: number; ms: number }[] = [];
      let startedAt = endedAt;
      let mistakes = 0;
      for (const t of real) {
        const timing = timings.get(t);
        // Reaction time (spec metrics.md): a timed token runs from the keystroke before its first
        // one to its last; one whose paths are still ambiguous ends now and starts where the
        // previous token ended. The first token of a test has no such keystroke: ms = 0 is no
        // measurement.
        const end = timing === undefined ? endedAt : (this.keyTimes[timing.lastKey] ?? endedAt);
        const since = timing === undefined ? this.lastTokenEnd : this.keyTimes[timing.firstKey - 1];
        if (tokenOutcomes.length === 0 && timing !== undefined) {
          startedAt = this.keyTimes[timing.firstKey] ?? endedAt;
        }
        this.lastTokenEnd = end;
        const tokenMistakes = this.errorLog.mistakes(t);
        mistakes += tokenMistakes;
        tokenOutcomes.push({
          kanaKey: matcher.tokens[t]?.kanaKey ?? null,
          mistakes: tokenMistakes,
          ms: since === undefined ? 0 : Math.max(1, end - since),
        });
      }

      recordPromptResult({
        key: this.prompts[local]?.key ?? '',
        startedAt,
        endedAt,
        mistakes,
        assisted: this.assisted.has(this.recorded),
        tokenOutcomes,
      });
      recordTokenOutcomes(tokenOutcomes);
      this.recorded += 1;
    }
  }

  // Drops settled prompts after every COMPACT_EVERY committed ones. They are the prompts that were
  // just recorded (settledPrompts in afterAccepted), so no result is lost.
  private compactIfDue(committed: number): void {
    const matcher = this.matcher;
    const state = this.matchState;
    if (matcher === null || state === null || committed < COMPACT_EVERY) return;
    const result = compact(matcher, state);
    if (result.droppedTokens === 0) return;

    const droppedPrompts = this.prompts.length - result.m.promptStarts.length;
    this.matcher = result.m;
    this.matchState = result.s;
    this.prompts.splice(0, droppedPrompts);
    this.promptBase += droppedPrompts;
    this.errorLog.rebase(result.droppedTokens);
    for (const k of this.committedAt.keys()) {
      if (k < this.promptBase) this.committedAt.delete(k);
    }
    for (const k of this.assisted) {
      if (k < this.promptBase) this.assisted.delete(k);
    }
  }

  private clearTimers(): void {
    if (this.deadlineTimeoutHandle) {
      this.scheduler.clearTimeout(this.deadlineTimeoutHandle);
      this.deadlineTimeoutHandle = null;
    }
    if (this.tickerIntervalHandle) {
      this.scheduler.clearInterval(this.tickerIntervalHandle);
      this.tickerIntervalHandle = null;
    }
    if (this.shakeTimeoutHandle) {
      this.scheduler.clearTimeout(this.shakeTimeoutHandle);
      this.shakeTimeoutHandle = null;
    }
  }
}
