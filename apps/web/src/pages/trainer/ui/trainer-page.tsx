import type { JSX } from 'preact';
import { useState, useLayoutEffect } from 'preact/hooks';
import { useComputed } from '@preact/signals';
import { t } from '@/shared/i18n';
import { createTrainer } from '@/features/training';
import type { Trainer } from '@/features/training';
import { ModePanel } from './mode-panel';
import { TestStage } from './test-stage';
import { ResultsPanel } from './results-panel';

export type TrainerPageProps = {
  // Tests pass a trainer with fixed prompts.
  readonly trainer?: Trainer;
};

export function TrainerPage(props: TrainerPageProps = {}): JSX.Element {
  const [trainer] = useState(() => props.trainer ?? createTrainer());
  const { session } = trainer;
  // Only the end of the test switches the screen. The start of it (idle to running) must not render
  // the page, so this is a computed value that does not change then.
  const finished = useComputed(() => session.phase.value === 'finished');

  // A layout effect: the first frame already shows a prompt, and unmounting stops the trainer at once.
  useLayoutEffect(() => trainer.start(), [trainer]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <ModePanel />

      {trainer.contentLoadFailed.value && (
        <div className="text-miss text-ui-label max-w-layout-test mx-auto w-full p-2.5 text-center">
          {t('stage.contentLoadError')}
        </div>
      )}

      {trainer.noKanaForRows.value && (
        <div
          role="status"
          className="text-fur-dim text-ui-label max-w-layout-test mx-auto w-full p-2.5 text-center"
        >
          {t('stage.noKanaForRows')}
        </div>
      )}

      {trainer.isLoadingContent.value && (
        <div className="text-fur-dim text-ui-label animate-blink max-w-layout-test mx-auto w-full p-2.5 text-center">
          {t('stage.contentLoading')}
        </div>
      )}

      {finished.value ? (
        <ResultsPanel session={session} onNextTest={trainer.restart} />
      ) : (
        <TestStage session={session} onRestart={trainer.restart} />
      )}
    </div>
  );
}
