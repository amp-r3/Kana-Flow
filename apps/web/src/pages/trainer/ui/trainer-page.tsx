import type { JSX } from 'preact';
import { useState, useLayoutEffect } from 'preact/hooks';
import { t } from '@/shared/i18n';
import { createTrainer } from '@/features/training';
import type { Trainer } from '@/features/training';
import { TopBar } from './top-bar';
import { ConfigBar } from './config-bar';
import { RowsDialog } from './rows-dialog';
import { TestStage } from './test-stage';
import { ResultsPanel } from './results-panel';

export type TrainerPageProps = {
  // Tests pass a trainer with fixed prompts.
  readonly trainer?: Trainer;
};

export function TrainerPage(props: TrainerPageProps = {}): JSX.Element {
  const [rowsDialogOpen, setRowsDialogOpen] = useState(false);
  const [trainer] = useState(() => props.trainer ?? createTrainer());
  const { session } = trainer;

  // A layout effect: the first frame already shows a prompt, and unmounting stops the trainer at once.
  useLayoutEffect(() => trainer.start(), [trainer]);

  return (
    <div className="bg-bg text-fur flex min-h-screen flex-col">
      <div className="max-w-layout-max mx-auto flex w-full flex-1 flex-col px-4 pb-12">
        <TopBar
          onOpenRows={() => {
            setRowsDialogOpen(true);
          }}
        />

        <main className="mt-4 flex flex-1 flex-col items-center justify-center gap-6">
          <ConfigBar />

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

          {session.phase.value === 'finished' ? (
            <ResultsPanel session={session} onNextTest={trainer.restart} />
          ) : (
            <TestStage session={session} onRestart={trainer.restart} />
          )}
        </main>
      </div>

      <RowsDialog
        open={rowsDialogOpen}
        onClose={() => {
          setRowsDialogOpen(false);
        }}
      />
    </div>
  );
}
