import type { ReadonlySignal } from '@preact/signals';
import { batch, computed, effect, signal, untracked } from '@preact/signals';
import { createSession } from './session';
import type { Session } from './session';
import { setupSettingsResetWatcher } from './settings-watcher';
import { createPromptWeights } from '../lib/prompt-weights';
import { buildPool, loadContent, pickPrompt, rowsYieldKana } from '@/entities/prompt';
import type { ContentItem, PromptItem } from '@/entities/prompt';
import {
  contentSetting,
  getPracticeSettings,
  rowIdsSetting,
  scriptSetting,
  strictnessSetting,
  testConfig,
} from '@/entities/settings';
import { progressStats } from '@/entities/stats';
import type { Clock, Rng, Scheduler } from '@/shared/lib';
import { defaultClock, defaultRng, defaultScheduler } from '@/shared/lib';

export type TrainerDeps = {
  // Replaces the weighted picker; tests use it to fix the prompts.
  readonly nextPrompt?: () => PromptItem;
  readonly rng?: Rng;
  readonly clock?: Clock;
  readonly scheduler?: Scheduler;
};

/**
 * The training screen as state: one session, the prompt source that feeds it, and the loading of
 * vocabulary content. A view reads these signals and calls `restart()`.
 */
export type Trainer = {
  readonly session: Session;
  readonly isLoadingContent: ReadonlySignal<boolean>;
  readonly contentLoadFailed: ReadonlySignal<boolean>;
  // D20: the selected rows give no kana for the script, so the basic rows are practised.
  readonly noKanaForRows: ReadonlySignal<boolean>;
  // Discards the running test and shows a fresh prompt.
  readonly restart: () => void;
  // Loads the selected vocabulary again after a failure.
  readonly retryContent: () => void;
  // Shows the first prompt and starts following the settings. Returns the function that stops it.
  readonly start: () => () => void;
};

type VocabularyKind = 'words' | 'phrases';

export function createTrainer(deps: TrainerDeps = {}): Trainer {
  const rng = deps.rng ?? defaultRng;
  const promptWeights = createPromptWeights();
  const vocabulary: Record<VocabularyKind, readonly ContentItem[]> = { words: [], phrases: [] };
  let previousKey: string | null = null;
  let stopped = false;

  // Loads in flight and failed ones, per kind. Only the selected kind is shown or blocks input.
  const loading = signal<ReadonlySet<VocabularyKind>>(new Set());
  const failed = signal<ReadonlySet<VocabularyKind>>(new Set());
  const selectedKind = (): VocabularyKind | null => {
    const kind = contentSetting.value;
    return kind === 'words' || kind === 'phrases' ? kind : null;
  };
  const isLoadingContent = computed(() => {
    const kind = selectedKind();
    return kind !== null && loading.value.has(kind);
  });
  const contentLoadFailed = computed(() => {
    const kind = selectedKind();
    return kind !== null && failed.value.has(kind);
  });

  const nextPrompt =
    deps.nextPrompt ??
    ((): PromptItem => {
      const settings = getPracticeSettings();
      const content =
        settings.content === 'words' || settings.content === 'phrases'
          ? vocabulary[settings.content]
          : undefined;
      const pool = buildPool(settings, content);
      const weights = settings.weakFocus
        ? promptWeights(pool, progressStats.value)
        : new Map<string, number>();
      const picked = pickPrompt(pool, weights, rng, previousKey);
      previousKey = picked.key;
      return picked;
    });

  const session = createSession({
    nextPrompt,
    config: () => testConfig.value,
    clock: deps.clock ?? defaultClock,
    scheduler: deps.scheduler ?? defaultScheduler,
    // The prompts of the selected content are not here yet: nothing to type.
    inputBlocked: () => isLoadingContent.peek(),
    // A zen test ended with nothing to keep: a fresh prompt, as after a restart.
    onDiscard: () => {
      restart();
    },
  });

  const restart = (): void => {
    session.reset();
    // While the selected vocabulary loads there is no prompt; its arrival restarts again.
    if (isLoadingContent.peek()) return;
    session.loadPrompt(nextPrompt(), strictnessSetting.value);
  };

  const mark = (set: typeof loading, kind: VocabularyKind, on: boolean): void => {
    const next = new Set(set.value);
    if (on) next.add(kind);
    else next.delete(kind);
    set.value = next;
  };

  const ensureLoaded = (kind: VocabularyKind): void => {
    if (vocabulary[kind].length > 0 || loading.peek().has(kind)) return;
    batch(() => {
      mark(loading, kind, true);
      mark(failed, kind, false);
    });
    // The prompt on display is of the fallback pool: drop it until the vocabulary is here.
    if (!stopped && selectedKind() === kind) restart();
    void loadContent(kind)
      .then((items) => {
        // Kept whatever happens next, so the kind is not fetched again.
        vocabulary[kind] = items;
        mark(loading, kind, false);
        if (!stopped && selectedKind() === kind) restart();
      })
      .catch(() => {
        batch(() => {
          mark(loading, kind, false);
          mark(failed, kind, true);
        });
        // The setting stays; the fallback pool is practised until Retry.
        if (!stopped && selectedKind() === kind) restart();
      });
  };

  return {
    session,
    isLoadingContent,
    contentLoadFailed,
    noKanaForRows: computed(
      () =>
        contentSetting.value === 'single' &&
        !rowsYieldKana({ script: scriptSetting.value, rowIds: rowIdsSetting.value }),
    ),
    restart,
    retryContent() {
      const kind = selectedKind();
      if (kind !== null) {
        ensureLoaded(kind);
        restart();
      }
    },
    start() {
      stopped = false;
      // Loading first: a selected vocabulary that is missing blocks the first prompt.
      const stopLoading = effect(() => {
        const kind = contentSetting.value;
        untracked(() => {
          if (kind === 'words' || kind === 'phrases') ensureLoaded(kind);
        });
      });
      restart();
      const stopWatching = setupSettingsResetWatcher(restart);
      return () => {
        stopped = true;
        // Leaving the screen drops a running test (metrics.md): no timer outlives it.
        session.reset();
        stopWatching();
        stopLoading();
      };
    },
  };
}
