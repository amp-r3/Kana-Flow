import type { ReadonlySignal } from '@preact/signals';
import { batch, computed, signal } from '@preact/signals';
import type { KeyIntent } from '../lib/input-adapter';
import { computeMetrics } from '../lib/metrics';
import { createKeyTally } from '../lib/key-tally';
import type { Phase, PromptResult, SessionMetrics } from './types';
import {
  AHEAD_TOKENS,
  EMPTY_STREAM,
  MAX_WINDOW_PROMPTS,
  shouldPublish,
  staleCount,
  streamPromptsOf,
} from './stream';
import type { Mistake, StreamPrompt, StreamSnapshot } from './stream';
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
import type { TestConfig } from '@/entities/settings';
import { recordTokenOutcomes, flushProgress } from '@/entities/stats';
import type { Clock, Scheduler, TimeoutHandle } from '@/shared/lib';
import { defaultClock, defaultScheduler } from '@/shared/lib';

// Committed prompts after which the matcher drops them (spec "Window").
const COMPACT_EVERY = 20;

// A live indicator stays at 0 until this much of the test has passed, so the first keys do not
// show a figure that is only noise.
const MIN_LIVE_MS = 1000;

export type SessionDeps = {
  readonly nextPrompt: () => PromptItem;
  // Read when a test starts, so a settings change takes effect on the next test.
  readonly config: () => TestConfig;
  readonly clock?: Clock;
  readonly scheduler?: Scheduler;
  // Called when a test is ended by hand with nothing to keep (no prompt completed, or no time
  // passed): it is dropped like a restart, and this starts the next one. Defaults to `reset()`.
  readonly onDiscard?: () => void;
};

/** What a view may read and call. Everything a session holds is private to this instance (D17). */
export type Session = {
  readonly isAssisted: ReadonlySignal<boolean>;
  readonly currentPrompt: ReadonlySignal<PromptItem | null>;
  readonly canonicalRomaji: ReadonlySignal<string>;
  readonly tickerNow: ReadonlySignal<number>;
  readonly phase: ReadonlySignal<Phase>;
  readonly metrics: ReadonlySignal<SessionMetrics | null>;
  readonly promptResults: ReadonlySignal<readonly PromptResult[]>;
  readonly correctKeystrokes: ReadonlySignal<number>;
  readonly mistakeCount: ReadonlySignal<number>;
  readonly sessionStartedAt: ReadonlySignal<number>;
  // Committed tokens per minute and kana accuracy in percent, for the live strip (metrics.md).
  readonly liveKpm: ReadonlySignal<number>;
  readonly liveAccuracy: ReadonlySignal<number>;
  // The text stream (frontend.md). `stream` lists the prompts to draw. It changes only when the view
  // needs a new window, when the tokens ahead run low or the ones behind pile up (stream.ts): never
  // on a keystroke inside a prompt, and not at every completed prompt either. The rest changes on a
  // keystroke and is meant to be written to the DOM without a render: `caret` is the number of the token the caret stands
  // before, `romajiBuffer` the Latin typed beyond it, `mistake` the latest wrong key or hint.
  // Token numbers count from the start of the test and survive `compact()`.
  readonly stream: ReadonlySignal<StreamSnapshot>;
  readonly caret: ReadonlySignal<number>;
  readonly romajiBuffer: ReadonlySignal<string>;
  readonly mistake: ReadonlySignal<Mistake | null>;
  // Tokens of the stream that have been charged an error (D11); read to paint a stream afresh.
  erroredTokens(): ReadonlySet<number>;
  loadPrompt(prompt: PromptItem, strictness: Strictness): void;
  handleIntent(intent: KeyIntent): void;
  finishSession(): void;
  // Ends a zen test by hand (the Finish button, Ctrl/Cmd+Enter). It keeps the test when a prompt is
  // completed and time has passed, and drops it like a restart otherwise (metrics.md, "Test end").
  // Any other kind of test, and a test that has not started, ignore it.
  finish(): void;
  reset(): void;
};

export function createSession(deps: SessionDeps): Session {
  return new TrainingSession(
    deps.nextPrompt,
    deps.config,
    deps.clock ?? defaultClock,
    deps.scheduler ?? defaultScheduler,
    deps.onDiscard,
  );
}

/**
 * Types a stream of prompts. The matcher holds a window of the displayed prompt and the next ones;
 * the next prompt is displayed as soon as the live conversion reaches the end of the current one,
 * and a result is recorded when `committedPrompts()` includes the prompt (spec D3, A15).
 *
 * Prompts are numbered from the start of the test ("absolute"); the matcher numbers them from the
 * first prompt of its window ("local"), which moves when `compact()` drops committed prompts.
 */
class TrainingSession implements Session {
  private readonly _isAssisted = signal<boolean>(false);
  private readonly _currentPrompt = signal<PromptItem | null>(null);
  private readonly _canonicalRomaji = signal<string>('');
  private readonly _tickerNow = signal<number>(0);
  private readonly _phase = signal<Phase>('idle');
  private readonly _metrics = signal<SessionMetrics | null>(null);
  private readonly _promptResults = signal<readonly PromptResult[]>([]);
  private readonly _correctKeystrokes = signal<number>(0);
  private readonly _mistakeCount = signal<number>(0);
  private readonly _sessionStartedAt = signal<number>(0);
  private readonly _stream = signal<StreamSnapshot>(EMPTY_STREAM);
  private readonly _caret = signal<number>(0);
  private readonly _romajiBuffer = signal<string>('');
  private readonly _mistake = signal<Mistake | null>(null);
  private readonly _committedTokens = signal<number>(0);
  private readonly _erroredTokens = signal<number>(0);

  readonly isAssisted: ReadonlySignal<boolean> = this._isAssisted;
  readonly currentPrompt: ReadonlySignal<PromptItem | null> = this._currentPrompt;
  readonly canonicalRomaji: ReadonlySignal<string> = this._canonicalRomaji;
  readonly tickerNow: ReadonlySignal<number> = this._tickerNow;
  readonly phase: ReadonlySignal<Phase> = this._phase;
  readonly metrics: ReadonlySignal<SessionMetrics | null> = this._metrics;
  readonly promptResults: ReadonlySignal<readonly PromptResult[]> = this._promptResults;
  readonly correctKeystrokes: ReadonlySignal<number> = this._correctKeystrokes;
  readonly mistakeCount: ReadonlySignal<number> = this._mistakeCount;
  readonly sessionStartedAt: ReadonlySignal<number> = this._sessionStartedAt;

  readonly stream: ReadonlySignal<StreamSnapshot> = this._stream;
  readonly caret: ReadonlySignal<number> = this._caret;
  readonly romajiBuffer: ReadonlySignal<string> = this._romajiBuffer;
  readonly mistake: ReadonlySignal<Mistake | null> = this._mistake;

  readonly liveKpm: ReadonlySignal<number> = computed(() => {
    const startedAt = this._sessionStartedAt.value;
    const elapsed = this._tickerNow.value - startedAt;
    if (startedAt === 0 || elapsed < MIN_LIVE_MS) return 0;
    return Math.round(this._committedTokens.value / (elapsed / 60000));
  });

  readonly liveAccuracy: ReadonlySignal<number> = computed(() => {
    const committed = this._committedTokens.value;
    if (committed === 0) return 100;
    return Math.round(((committed - this._erroredTokens.value) / committed) * 100);
  });

  private matcher: Matcher | null = null;
  private matchState: MatchState | null = null;

  private readonly keyTally = createKeyTally();
  // The prompts drawn in the stream, which outlive their tokens in the matcher: the matcher drops
  // committed prompts, the stream keeps the line just typed on screen.
  private streamPrompts: StreamPrompt[] = [];
  // Number, from the start of the test, of the matcher's first token; compact() raises it.
  private tokenBase = 0;
  private readonly erroredAbs = new Set<number>();
  private mistakeSeq = 0;
  // Index in the matcher's tokens up to which committed tokens are counted for the live strip.
  private committedPtr = 0;

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

  constructor(
    private readonly nextPrompt: () => PromptItem,
    private readonly config: () => TestConfig,
    private readonly clock: Clock,
    private readonly scheduler: Scheduler,
    private readonly onDiscard: (() => void) | undefined,
  ) {}

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
    this.committedPtr = 0;
    this.tokenBase = 0;
    this.streamPrompts = [];
    this.erroredAbs.clear();
    const matcher = compile([prompt], strictness);
    const state = start(matcher);
    this.matcher = matcher;
    this.matchState = state;
    this.streamPrompts = streamPromptsOf(matcher, 0, this.promptBase, this.tokenBase);
    this._mistake.value = null;
    this.fillWindow();
    const v = view(matcher, state);
    this.showPrompt(v);
    this.updateCaret(v);
  }

  handleIntent(intent: KeyIntent): void {
    if (this._phase.value === 'finished' || intent.kind === 'ignore') {
      return;
    }
    if (intent.kind === 'finish') {
      this.finish();
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
        const target = errorTarget(matcher, state);
        this.errorLog.record(target, null, '');
        if (this._phase.value === 'idle') this.mistakesBeforeStart += 1;
        batch(() => {
          this._mistakeCount.value += 1;
          this.noteMistake(target, 'hint');
        });
      }
      return;
    }

    // First typed letter starts the test if idle
    if (this._phase.value === 'idle') {
      this.beginTest(now);
    }

    // One batch per keystroke: a reader of several signals sees them in step.
    batch(() => {
      const next = step(matcher, state, intent.char);
      if (next === null) {
        this.reject(matcher, state, intent.char, now);
        return;
      }

      this.keyTally.record(now, true);
      this._correctKeystrokes.value += 1;
      this.keyTimes.push(now);
      this.matchState = next;
      this.afterAccepted(matcher, next, now);
    });
  }

  finishSession(): void {
    if (this.matcher !== null && this.matchState !== null && this._phase.value === 'running') {
      this.flushResults(this.promptBase + committedPrompts(this.matcher, this.matchState));
    }
    this.clearTimers();
    this.finishTest(this.clock.now());
    flushProgress();
  }

  finish(): void {
    const matcher = this.matcher;
    const state = this.matchState;
    if (this.config().kind !== 'zen' || this._phase.value !== 'running') return;
    if (matcher === null || state === null) return;

    const now = this.clock.now();
    const completed = this.promptBase + committedPrompts(matcher, state);
    const elapsed = now - (this.keyTally.snapshot.firstAt ?? now);
    if (completed >= 1 && elapsed > 0) {
      this.finishSession();
      return;
    }
    // Nothing worth keeping: back to a new test, without a results screen.
    this.clearTimers();
    if (this.onDiscard) {
      this.onDiscard();
    } else {
      this.reset();
    }
  }

  reset(): void {
    this.clearTimers();
    this.matcher = null;
    this.matchState = null;
    this.prompts = [];
    this.keyTimes = [];
    this.committedAt.clear();
    this.assisted.clear();
    this._isAssisted.value = false;
    this._canonicalRomaji.value = '';
    this.streamPrompts = [];
    this.tokenBase = 0;
    this.erroredAbs.clear();
    this._stream.value = EMPTY_STREAM;
    this._caret.value = 0;
    this._romajiBuffer.value = '';
    this._mistake.value = null;
    this.resetState();
  }

  erroredTokens(): ReadonlySet<number> {
    return this.erroredAbs;
  }

  private beginTest(now: number): void {
    this.resetState();
    this._phase.value = 'running';
    this._sessionStartedAt.value = now;
    // Mistakes made by Esc before the first key count for this test.
    this._mistakeCount.value = this.mistakesBeforeStart;

    // If time test, arm deadline timer
    const config = this.config();
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

  // Rejected: the view flashes the caret (`mistake`), and the key is charged to errorTarget() (D10, A34).
  private reject(matcher: Matcher, state: MatchState, char: string, now: number): void {
    this.keyTally.record(now, false);
    this._mistakeCount.value += 1;
    const target = errorTarget(matcher, state);
    this.errorLog.record(target, matcher.tokens[target]?.kanaKey ?? null, char);
    this.noteMistake(target, 'rejected');
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

    // Live strip: tokens before the earliest active token are committed in every position.
    const v = view(matcher, state);
    this.advanceCommitted(matcher, v.activeToken);
    this.updateCaret(v);
    this._tickerNow.value = now;

    // The last prompt of a count test ends it as soon as the stream is complete.
    if (this.isFinalStream() && isComplete(matcher, state)) {
      this.flushResults(this.promptBase + this.prompts.length);
      this.finishSession();
      return;
    }

    // Move to the next prompt when the live conversion has reached it.
    const last = matcher.tokens.length - 1;
    const local = matcher.tokens[Math.min(v.displayedTokens, last)]?.promptIndex ?? 0;
    if (this.promptBase + local > this.displayed) {
      this.displayed = this.promptBase + local;
      this.fillWindow();
      this.showPrompt(v);
    }

    this.compactIfDue(localCommitted);
  }

  // Counts the non-skip tokens that became committed, and those of them that were errored, once
  // each. Tokens before `upTo` cannot change any more: the earliest active position has passed them.
  private advanceCommitted(matcher: Matcher, upTo: number): void {
    if (upTo <= this.committedPtr) return;
    let committed = 0;
    let errored = 0;
    for (let t = this.committedPtr; t < upTo; t++) {
      if (matcher.tokens[t]?.kind === 'skip') continue;
      committed += 1;
      if (this.errorLog.errored(t)) errored += 1;
    }
    this.committedPtr = upTo;
    this._committedTokens.value += committed;
    this._erroredTokens.value += errored;
  }

  private finishTest(endTimeMs: number): void {
    this._phase.value = 'finished';
    this._metrics.value = computeMetrics(
      this.keyTally.snapshot,
      this._promptResults.value,
      endTimeMs,
    );
  }

  private resetState(): void {
    this._phase.value = 'idle';
    this._sessionStartedAt.value = 0;
    this._correctKeystrokes.value = 0;
    this._mistakeCount.value = 0;
    this._committedTokens.value = 0;
    this._erroredTokens.value = 0;
    this._promptResults.value = [];
    this._metrics.value = null;
    this.keyTally.reset();
    this.committedPtr = 0;
  }

  private promptLimit(): number {
    const config = this.config();
    return config.kind === 'count' ? config.prompts : Number.POSITIVE_INFINITY;
  }

  private isFinalStream(): boolean {
    return this.promptBase + this.prompts.length >= this.promptLimit();
  }

  // Keeps the displayed prompt and, after it, enough prompts to fill the lines of the stream
  // (AHEAD_TOKENS), up to the end of a count test. They all stand in the matcher, so the context of
  // a non-final ん is known long before it is typed (spec "Window"), and the stream draws tokens the
  // matcher has already cut. They are asked for in batches sized by the prompts seen so far.
  private fillWindow(): void {
    for (;;) {
      const matcher = this.matcher;
      if (matcher === null) return;
      const have = this.promptBase + this.prompts.length;
      const limit = this.promptLimit();
      if (have >= limit || this.prompts.length >= MAX_WINDOW_PROMPTS) return;

      const local = this.displayed - this.promptBase;
      const endOfDisplayed = matcher.promptStarts[local + 1] ?? matcher.tokens.length;
      const ahead = matcher.tokens.length - endOfDisplayed;
      if (ahead >= AHEAD_TOKENS) return;

      const perPrompt = Math.max(1, matcher.tokens.length / this.prompts.length);
      const count = Math.min(
        Math.max(1, Math.ceil((AHEAD_TOKENS - ahead) / perPrompt)),
        limit - have,
        MAX_WINDOW_PROMPTS - this.prompts.length,
      );
      const more: PromptItem[] = [];
      for (let i = 0; i < count; i++) more.push(this.nextPrompt());

      const firstNew = matcher.promptStarts.length;
      this.prompts.push(...more);
      const extended = extend(matcher, more);
      this.matcher = extended;
      this.streamPrompts.push(
        ...streamPromptsOf(extended, firstNew, this.promptBase, this.tokenBase),
      );
    }
  }

  private showPrompt(v: EngineView): void {
    const matcher = this.matcher;
    const local = this.displayed - this.promptBase;
    this._currentPrompt.value = this.prompts[local] ?? null;
    this._canonicalRomaji.value = matcher === null ? '' : canonical(matcher, local);
    this._isAssisted.value = this.assisted.has(this.displayed);
    this.publishStream(this.tokenBase + v.displayedTokens);
  }

  // Drops the prompts that ended long before the caret and publishes the window when the view needs
  // it. Called when the displayed prompt changes; the view is redrawn at most once per completed
  // prompt, and in practice every few.
  private publishStream(caret: number): void {
    const stale = staleCount(this.streamPrompts, caret);
    if (stale > 0) this.streamPrompts.splice(0, stale);
    const head = this.streamPrompts[0]?.firstToken ?? 0;
    for (const token of this.erroredAbs) {
      if (token < head) this.erroredAbs.delete(token);
    }
    // Not at every change: see stream.ts. The view is redrawn when the window is about to run out.
    if (shouldPublish(this._stream.value.prompts, this.streamPrompts, caret)) {
      this._stream.value = { prompts: [...this.streamPrompts] };
    }
  }

  private updateCaret(v: EngineView): void {
    this._caret.value = this.tokenBase + v.displayedTokens;
    this._romajiBuffer.value = v.pendingLatin;
  }

  private noteMistake(localToken: number, kind: Mistake['kind']): void {
    const token = this.tokenBase + localToken;
    this.erroredAbs.add(token);
    this.mistakeSeq += 1;
    this._mistake.value = { seq: this.mistakeSeq, token, kind };
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

      this._promptResults.value = [
        ...this._promptResults.value,
        {
          key: this.prompts[local]?.key ?? '',
          startedAt,
          endedAt,
          mistakes,
          assisted: this.assisted.has(this.recorded),
          tokenOutcomes,
        },
      ];
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
    this.tokenBase += result.droppedTokens;
    this.committedPtr = Math.max(0, this.committedPtr - result.droppedTokens);
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
  }
}
