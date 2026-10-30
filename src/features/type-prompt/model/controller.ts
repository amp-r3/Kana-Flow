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
  readonly typedBuffer = signal<string>('');
  readonly isShaking = signal<boolean>(false);
  readonly isAssisted = signal<boolean>(false);
  readonly imeNotice = signal<boolean>(false);
  readonly currentPrompt = signal<PromptItem | null>(null);
  readonly activeTokenIdx = signal<number>(0);
  readonly canonicalRomaji = signal<string>('');
  readonly tickerNow = signal<number>(0);

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
    this.currentPrompt.value = prompt;
    this.matcher = compile(prompt, strictness);
    this.matchState = start(this.matcher);
    this.canonicalRomaji.value = canonical(this.matcher);

    this.typedBuffer.value = '';
    this.isAssisted.value = false;
    this.isShaking.value = false;
    this.activeTokenIdx.value = 0;
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
    this.imeNotice.value = true;
  }

  handleCompositionEnd(): void {
    this.imeNotice.value = false;
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
      if (!this.matcher || !this.currentPrompt.value) return;

      if (!this.isAssisted.value) {
        this.isAssisted.value = true;
        this.promptMistakes += 1;
        recordMistake();
        const tracker = this.tokenTrackers[this.activeTokenIdx.value];
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

    if (!this.matcher || !this.matchState || !this.currentPrompt.value) {
      return;
    }

    // First accepted/typed letter starts the test if idle
    if (phase.value === 'idle') {
      startTest(now);
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
      this.tickerNow.value = now;
      this.tickerIntervalHandle = this.scheduler.setInterval(() => {
        this.tickerNow.value = this.clock.now();
      }, 1000);
    }

    // Step the NFA engine
    const nextState = step(this.matcher, this.matchState, ch);

    if (nextState === null) {
      // Rejected: does not enter buffer; triggers shake; marks mistake on active token
      recordKeystroke(now, false);
      this.promptMistakes += 1;

      const tracker = this.tokenTrackers[this.activeTokenIdx.value];
      if (tracker) {
        tracker.mistakes += 1;
      }

      this.isShaking.value = true;
      if (this.shakeTimeoutHandle) {
        this.scheduler.clearTimeout(this.shakeTimeoutHandle);
      }
      this.shakeTimeoutHandle = this.scheduler.setTimeout(() => {
        this.isShaking.value = false;
        this.shakeTimeoutHandle = null;
      }, 280);
      return;
    }

    // Accepted!
    recordKeystroke(now, true);
    this.typedBuffer.value += ch;
    this.matchState = nextState;

    const prevTokenIdx = this.activeTokenIdx.value;
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
      this.activeTokenIdx.value = Math.min(newTokenIdx, this.matcher.tokens.length - 1);
    }

    // Check prompt completion
    if (isComplete(this.matcher, nextState)) {
      this.onPromptComplete(now, strictness);
    }
  }

  private onPromptComplete(now: number, strictness: Strictness): void {
    if (!this.matcher || !this.matchState || !this.currentPrompt.value) return;

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
      key: this.currentPrompt.value.key,
      startedAt: this.promptStartedAt,
      endedAt: now,
      mistakes: this.promptMistakes,
      assisted: this.isAssisted.value,
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
    this.typedBuffer.value = '';
    this.isShaking.value = false;
    this.isAssisted.value = false;
    this.imeNotice.value = false;
    this.activeTokenIdx.value = 0;
    this.canonicalRomaji.value = '';
    this.lastExtensions.clear();
    resetSession();
  }
}
