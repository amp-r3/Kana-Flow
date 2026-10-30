import type { JSX } from 'preact';
import { useState, useRef, useEffect, useCallback } from 'preact/hooks';
import { useComputed } from '@preact/signals';
import { defaultRng, defaultClock, defaultScheduler } from '@/shared/lib';
import { t } from '@/shared/i18n';
import {
  buildPool,
  pickPrompt,
  getPracticeSettings,
  strictnessSetting,
  contentSetting,
  setContent,
  loadContent,
} from '@/entities/kana';
import type { ContentItem, PromptItem } from '@/entities/kana';
import { phase } from '@/entities/session';
import { progressStats, computeWeights } from '@/entities/progress';
import { TypingController, setupSettingsResetWatcher } from '@/features/type-prompt';
import { TopBar } from './top-bar';
import { ConfigBar } from './config-bar';
import { RowsDialog } from './rows-dialog';
import { TestStage } from './test-stage';
import { ResultsPanel } from './results-panel';

export type TrainerPageProps = {
  readonly controller?: TypingController;
};

export function TrainerPage(props: TrainerPageProps = {}): JSX.Element {
  const [rowsDialogOpen, setRowsDialogOpen] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);

  const wordsRef = useRef<readonly ContentItem[]>([]);
  const phrasesRef = useRef<readonly ContentItem[]>([]);
  const previousKeyRef = useRef<string | null>(null);

  const getNextPrompt = useCallback((): PromptItem => {
    const settings = getPracticeSettings();
    let content: readonly ContentItem[] | undefined;
    if (settings.content === 'words') {
      content = wordsRef.current;
    } else if (settings.content === 'phrases') {
      content = phrasesRef.current;
    }

    const pool = buildPool(settings, content);
    const weights = settings.weakFocus
      ? computeWeights(
          progressStats.value,
          pool.map((item) => item.key),
        )
      : new Map<string, number>();

    const picked = pickPrompt(pool, weights, defaultRng, previousKeyRef.current);
    previousKeyRef.current = picked.key;
    return picked;
  }, []);

  const [internalController] = useState(
    () => new TypingController(getNextPrompt, defaultClock, defaultScheduler),
  );
  const controller = props.controller ?? internalController;

  const reloadFreshPrompt = useCallback(() => {
    controller.reset();
    const prompt = getNextPrompt();
    controller.loadPrompt(prompt, strictnessSetting.value);
  }, [controller, getNextPrompt]);

  // Initial prompt setup on mount
  useEffect(() => {
    reloadFreshPrompt();
  }, [reloadFreshPrompt]);

  // Single reactive effect watching all settings to reset session and refresh prompt
  useEffect(() => {
    return setupSettingsResetWatcher(reloadFreshPrompt);
  }, [reloadFreshPrompt]);

  // Lazy vocabulary content loader with loading state and fallback to single-kana on error
  useEffect(() => {
    const currentContent = contentSetting.value;
    if (currentContent === 'words' && wordsRef.current.length === 0) {
      setIsLoadingContent(true);
      setContentError(null);
      void loadContent('words')
        .then((w) => {
          wordsRef.current = w;
          setIsLoadingContent(false);
          reloadFreshPrompt();
        })
        .catch(() => {
          setIsLoadingContent(false);
          setContentError(t('stage.contentLoadError'));
          setContent('single');
        });
    } else if (currentContent === 'phrases' && phrasesRef.current.length === 0) {
      setIsLoadingContent(true);
      setContentError(null);
      void loadContent('phrases')
        .then((p) => {
          phrasesRef.current = p;
          setIsLoadingContent(false);
          reloadFreshPrompt();
        })
        .catch(() => {
          setIsLoadingContent(false);
          setContentError(t('stage.contentLoadError'));
          setContent('single');
        });
    }
  }, [contentSetting.value, reloadFreshPrompt]);

  const isFinished = useComputed(() => phase.value === 'finished');

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col font-sans">
      <div className="w-full max-w-4xl mx-auto px-4 flex flex-col flex-1 pb-12">
        <TopBar onOpenRows={() => { setRowsDialogOpen(true); }} />

        <main className="flex-1 flex flex-col items-center justify-center gap-6 mt-4">
          <ConfigBar />

          {contentError && (
            <div className="w-full max-w-2xl mx-auto p-2.5 rounded bg-error/15 border border-error/30 text-error text-xs text-center">
              {contentError}
            </div>
          )}

          {isLoadingContent && (
            <div className="w-full max-w-2xl mx-auto p-2.5 rounded bg-surface border border-border text-text-dim text-xs text-center animate-pulse">
              {t('stage.contentLoading')}
            </div>
          )}

          {isFinished.value ? (
            <ResultsPanel onNextTest={reloadFreshPrompt} />
          ) : (
            <TestStage controller={controller} onRestart={reloadFreshPrompt} />
          )}
        </main>
      </div>

      <RowsDialog
        open={rowsDialogOpen}
        onClose={() => { setRowsDialogOpen(false); }}
      />
    </div>
  );
}
