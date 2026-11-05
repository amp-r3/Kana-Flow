import type { JSX } from 'preact';
import { useState, useLayoutEffect } from 'preact/hooks';
import { useComputed } from '@preact/signals';
import { t } from '@/shared/i18n';
import { Button } from '@/shared/ui';
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

      {/* One slot for the notices, always there: a notice appearing must not move the text below. */}
      <div
        data-chrome
        data-testid="stage-notice"
        className="text-ui-label max-w-layout-test mx-auto flex min-h-12 w-full items-center justify-center gap-3 p-2.5 text-center"
      >
        {trainer.contentLoadFailed.value ? (
          <>
            <span role="alert" className="text-miss">
              {t('stage.contentLoadError')}
            </span>
            <Button onClick={trainer.retryContent}>{t('route.retry')}</Button>
          </>
        ) : trainer.isLoadingContent.value ? (
          <span role="status" className="text-fur-dim animate-blink">
            {t('stage.contentLoading')}
          </span>
        ) : trainer.noKanaForRows.value ? (
          <span role="status" className="text-fur-dim">
            {t('stage.noKanaForRows')}
          </span>
        ) : null}
      </div>

      {finished.value ? (
        <ResultsPanel session={session} onNextTest={trainer.restart} />
      ) : (
        <TestStage session={session} onRestart={trainer.restart} />
      )}
    </div>
  );
}
