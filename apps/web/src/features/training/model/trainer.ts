import type { ReadonlySignal } from '@preact/signals';
import { computed, effect, signal, untracked } from '@preact/signals';
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
  setContent,
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

  const isLoadingContent = signal(false);
  const contentLoadFailed = signal(false);

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
    // A zen test ended with nothing to keep: a fresh prompt, as after a restart.
    onDiscard: () => {
      restart();
    },
  });

  const restart = (): void => {
    session.reset();
    session.loadPrompt(nextPrompt(), strictnessSetting.value);
  };

  const ensureLoaded = (kind: VocabularyKind): void => {
    if (vocabulary[kind].length > 0) return;
    isLoadingContent.value = true;
    contentLoadFailed.value = false;
    void loadContent(kind)
      .then((items) => {
        vocabulary[kind] = items;
        isLoadingContent.value = false;
        if (!stopped) restart();
      })
      .catch(() => {
        isLoadingContent.value = false;
        contentLoadFailed.value = true;
        if (!stopped) setContent('single');
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
    start() {
      stopped = false;
      restart();
      const stopWatching = setupSettingsResetWatcher(restart);
      const stopLoading = effect(() => {
        const kind = contentSetting.value;
        untracked(() => {
          if (kind === 'words' || kind === 'phrases') ensureLoaded(kind);
        });
      });
      return () => {
        stopped = true;
        stopWatching();
        stopLoading();
      };
    },
  };
}
