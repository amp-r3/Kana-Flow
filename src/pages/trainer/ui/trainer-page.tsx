import type { JSX } from 'preact';
import { useState, useRef, useEffect, useCallback } from 'preact/hooks';
import { defaultRng, defaultClock, defaultScheduler } from '@/shared/lib';
import {
  buildPool,
  pickPrompt,
  getPracticeSettings,
  strictnessSetting,
  loadContent,
} from '@/entities/kana';
import type { ContentItem, PromptItem } from '@/entities/kana';
import { phase } from '@/entities/session';
import { progressStats, computeWeights } from '@/entities/progress';
import { TypingController } from '@/features/type-prompt';
import { TopBar } from './top-bar';
import { ConfigBar } from './config-bar';
import { RowsDialog } from './rows-dialog';
import { TestStage } from './test-stage';
import { ResultsPanel } from './results-panel';

export function TrainerPage(): JSX.Element {
  const [rowsDialogOpen, setRowsDialogOpen] = useState(false);
  const wordsRef = useRef<readonly ContentItem[]>([]);
  const phrasesRef = useRef<readonly ContentItem[]>([]);
  const previousKeyRef = useRef<string | null>(null);

  // Load async words and phrases chunks lazily
  useEffect(() => {
    void loadContent('words').then((w) => {
      wordsRef.current = w;
    });
    void loadContent('phrases').then((p) => {
      phrasesRef.current = p;
    });
  }, []);

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

  const [controller] = useState(
    () => new TypingController(getNextPrompt, defaultClock, defaultScheduler),
  );

  const reloadFreshPrompt = useCallback(() => {
    controller.reset();
    const prompt = getNextPrompt();
    controller.loadPrompt(prompt, strictnessSetting.value);
  }, [controller, getNextPrompt]);

  // Initial prompt setup on mount
  useEffect(() => {
    reloadFreshPrompt();
  }, [reloadFreshPrompt]);

  const handleSettingChange = () => {
    reloadFreshPrompt();
  };

  const currentPhase = phase.value;

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col font-sans">
      <div className="w-full max-w-4xl mx-auto px-4 flex flex-col flex-1 pb-12">
        <TopBar onOpenRows={() => { setRowsDialogOpen(true); }} />

        <main className="flex-1 flex flex-col items-center justify-center gap-6 mt-4">
          <ConfigBar onSettingChange={handleSettingChange} />

          {currentPhase === 'finished' ? (
            <ResultsPanel onNextTest={reloadFreshPrompt} />
          ) : (
            <TestStage controller={controller} onRestart={reloadFreshPrompt} />
          )}
        </main>
      </div>

      <RowsDialog
        open={rowsDialogOpen}
        onClose={() => { setRowsDialogOpen(false); }}
        onRowChange={handleSettingChange}
      />
    </div>
  );
}
