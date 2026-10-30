import type { ReadonlySignal } from '@preact/signals';
import { signal } from '@preact/signals';
import type { KeyIntent } from '../lib/input-adapter';
import type {
  PromptItem,
  Strictness,
  Matcher,
  MatchState,
} from '@/entities/kana';
import {
  compile,
  start,
  step,
  isComplete,
  activeTokenIndex,
  extensions,
  canonical,
  shouldAbsorb,
} from '@/entities/kana';
import {
  phase,
  testConfig,
  promptResults,
  startTest,
  recordKeystroke,
  recordMistake,
  recordPromptResult,
  finishTest,
  resetSession,
} from '@/entities/session';
import { recordTokenOutcomes, flushProgress } from '@/entities/progress';
import type { Clock, Scheduler, TimeoutHandle } from '@/shared/lib';
import { defaultClock, defaultScheduler } from '@/shared/lib';

export type TokenOutcomeTracker = {
  kanaKey: string | null;
  mistakes: number;
  startedAt: number;
  ms: number;
};

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

  private nextPrompt: () => PromptItem;
  private clock: Clock;
  private scheduler: Scheduler;

  private promptStartedAt = 0;
  private tokenTrackers: TokenOutcomeTracker[] = [];
  private promptMistakes = 0;

  // Trailing absorption window memory
  private lastExtensions = new Set<string>();
  private lastCompletedAt = 0;

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
    this._currentPrompt.value = prompt;
    this.matcher = compile(prompt, strictness);
    this.matchState = start(this.matcher);
    this._canonicalRomaji.value = canonical(this.matcher);

    this._typedBuffer.value = '';
    this._isAssisted.value = false;
    this._isShaking.value = false;
    this._activeTokenIdx.value = 0;
    this.promptMistakes = 0;

    const now = this.clock.now();
    this.promptStartedAt = now;

    this.tokenTrackers = this.matcher.tokens.map((t) => ({
      kanaKey: t.kanaKey,
      mistakes: 0,
      startedAt: now,
      ms: 0,
    }));
  }

  handleCompositionStart(): void {
    this._imeNotice.value = true;
  }

  handleCompositionEnd(): void {
    this._imeNotice.value = false;
  }

  handleIntent(intent: KeyIntent, strictness: Strictness): void {
    if (phase.value === 'finished') {
      return;
    }

    if (intent.kind === 'ignore') {
      return;
    }

    const now = this.clock.now();

    // Reveal intent (Esc)
    if (intent.kind === 'reveal') {
      if (!this.matcher || !this._currentPrompt.value) return;

      if (!this._isAssisted.value) {
        this._isAssisted.value = true;
        this.promptMistakes += 1;
        recordMistake();
        const tracker = this.tokenTrackers[this._activeTokenIdx.value];
        if (tracker) {
          tracker.mistakes += 1;
        }
      }
      return;
    }

    // Char intent
    const ch = intent.char;

    // Check absorption window from previous prompt
    if (
      this.lastExtensions.size > 0 &&
      shouldAbsorb(this.lastExtensions, this.lastCompletedAt, now, ch, 250)
    ) {
      // Swallowed silently: not a mistake, not recorded in session, no buffer change
      this.lastExtensions.clear();
      return;
    }
    // Expired or non-extension key clears absorption window
    this.lastExtensions.clear();

    if (!this.matcher || !this.matchState || !this._currentPrompt.value) {
      return;
    }

    // First accepted/typed letter starts the test if idle
    if (phase.value === 'idle') {
      startTest(now);
      if (this.promptMistakes > 0) {
        for (let i = 0; i < this.promptMistakes; i++) {
          recordMistake();
        }
      }
      this.promptStartedAt = now;
      for (const tr of this.tokenTrackers) {
        tr.startedAt = now;
      }

      // If time test, arm deadline timer
      const config = testConfig.value;
      if (config.kind === 'time') {
        const ms = config.seconds * 1000;
        this.deadlineTimeoutHandle = this.scheduler.setTimeout(() => {
          this.finishSession();
        }, ms);
      }

      // 1 Hz ticker for live stats
      this._tickerNow.value = now;
      this.tickerIntervalHandle = this.scheduler.setInterval(() => {
        this._tickerNow.value = this.clock.now();
      }, 1000);
    }

    // Step the NFA engine
    const nextState = step(this.matcher, this.matchState, ch);

    if (nextState === null) {
      // Rejected: does not enter buffer; triggers shake; marks mistake on active token
      recordKeystroke(now, false);
      this.promptMistakes += 1;

      const tracker = this.tokenTrackers[this._activeTokenIdx.value];
      if (tracker) {
        tracker.mistakes += 1;
      }

      this._isShaking.value = true;
      if (this.shakeTimeoutHandle) {
        this.scheduler.clearTimeout(this.shakeTimeoutHandle);
      }
      this.shakeTimeoutHandle = this.scheduler.setTimeout(() => {
        this._isShaking.value = false;
        this.shakeTimeoutHandle = null;
      }, 280);
      return;
    }

    // Accepted!
    recordKeystroke(now, true);
    this._typedBuffer.value += ch;
    this.matchState = nextState;

    const prevTokenIdx = this._activeTokenIdx.value;
    const newTokenIdx = activeTokenIndex(nextState);

    // If active token advanced, mark completion latency for previous tokens
    if (newTokenIdx > prevTokenIdx) {
      for (let i = prevTokenIdx; i < newTokenIdx; i++) {
        const tr = this.tokenTrackers[i];
        if (tr && tr.ms === 0) {
          tr.ms = Math.max(1, now - tr.startedAt);
        }
        const nextTr = this.tokenTrackers[i + 1];
        if (nextTr && nextTr.ms === 0) {
          nextTr.startedAt = now;
        }
      }
      this._activeTokenIdx.value = Math.min(newTokenIdx, this.matcher.tokens.length - 1);
    }

    // Check prompt completion
    if (isComplete(this.matcher, nextState)) {
      this.onPromptComplete(now, strictness);
    }
  }

  private onPromptComplete(now: number, strictness: Strictness): void {
    if (!this.matcher || !this.matchState || !this._currentPrompt.value) return;

    // Finalize token outcomes
    for (const tr of this.tokenTrackers) {
      if (tr.ms === 0) {
        tr.ms = Math.max(1, now - tr.startedAt);
      }
    }

    const tokenOutcomes = this.tokenTrackers.map((tr) => ({
      kanaKey: tr.kanaKey,
      mistakes: tr.mistakes,
      ms: tr.ms,
    }));

    recordPromptResult({
      key: this._currentPrompt.value.key,
      startedAt: this.promptStartedAt,
      endedAt: now,
      mistakes: this.promptMistakes,
      assisted: this._isAssisted.value,
      tokenOutcomes,
    });

    recordTokenOutcomes(tokenOutcomes);

    // Trailing absorption extensions
    const exts = extensions(this.matcher, this.matchState);
    if (exts.size > 0) {
      this.lastExtensions = new Set(exts);
      this.lastCompletedAt = now;
    } else {
      this.lastExtensions.clear();
    }

    const config = testConfig.value;
    if (config.kind === 'count') {
      const promptCount = promptResults.value.length;
      if (promptCount >= config.prompts) {
        this.finishSession();
        return;
      }
    }

    // Advance to next prompt immediately
    const nextPrompt = this.nextPrompt();
    this.loadPrompt(nextPrompt, strictness);
  }

  finishSession(): void {
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
    const now = this.clock.now();
    finishTest(now);
    flushProgress();
  }

  reset(): void {
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
    this._typedBuffer.value = '';
    this._isShaking.value = false;
    this._isAssisted.value = false;
    this._imeNotice.value = false;
    this._activeTokenIdx.value = 0;
    this._canonicalRomaji.value = '';
    this.lastExtensions.clear();
    resetSession();
  }
}
