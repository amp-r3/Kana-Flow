import type { JSX } from 'preact';
import { t } from '@/shared/i18n';
import type { Strictness } from '@/entities/prompt';
import { testConfig } from '@/entities/settings';
import type { Session } from '@/features/training';

export type LiveStatsStripProps = {
  readonly session: Session;
  readonly strictness: Strictness;
};

export function LiveStatsStrip({ session, strictness }: LiveStatsStripProps): JSX.Element {
  const currentPhase = session.phase.value;
  const currentConfig = testConfig.value;

  const startedAt = session.sessionStartedAt.value;
  const now = session.tickerNow.value || startedAt;
  const elapsedSec = startedAt > 0 && now > startedAt ? (now - startedAt) / 1000 : 0;

  let progressText = '';
  if (currentConfig.kind === 'time') {
    const remaining = Math.max(0, currentConfig.seconds - Math.floor(elapsedSec));
    progressText = `${remaining}s`;
  } else {
    const completed = session.promptResults.value.length;
    progressText = `${completed} / ${currentConfig.prompts}`;
  }

  return (
    <div className="text-fur-dim border-line text-ui-caption flex w-full items-center justify-between border-b px-2 pb-2">
      <div className="flex items-center gap-4">
        <span className="text-eye text-mono-small font-mono">{progressText}</span>
        {currentPhase === 'running' && (
          <>
            <span data-testid="live-kpm" className="text-mono-small font-mono">
              {session.liveKpm.value}{' '}
              <span className="text-mono-small font-mono">{t('stage.liveKpm')}</span>
            </span>
            <span className="text-mono-small font-mono">{session.liveAccuracy.value}%</span>
          </>
        )}
      </div>
      <div className="text-ui-caption">
        {strictness === 'ime' ? t('config.strictness.ime') : t('config.strictness.learner')}
      </div>
    </div>
  );
}
