import type { JSX } from 'preact';
import { t } from '@/shared/i18n';
import type { Strictness } from '@/entities/kana';
import {
  phase,
  testConfig,
  promptResults,
  correctKeystrokes,
  mistakeCount,
  sessionStartedAt,
} from '@/entities/session';
import type { TypingController } from '@/features/type-prompt';

export type LiveStatsStripProps = {
  readonly controller: TypingController;
  readonly strictness: Strictness;
};

export function LiveStatsStrip({ controller, strictness }: LiveStatsStripProps): JSX.Element {
  const currentPhase = phase.value;
  const currentConfig = testConfig.value;

  const correct = correctKeystrokes.value;
  const mistakes = mistakeCount.value;
  const startedAt = sessionStartedAt.value;
  const now = controller.tickerNow.value || (startedAt ? startedAt : 0);

  const elapsedSec = startedAt > 0 && now > startedAt ? (now - startedAt) / 1000 : 0;
  const elapsedMin = elapsedSec / 60;
  const liveWpm = elapsedMin > 0 ? Math.round(correct / 5 / elapsedMin) : 0;
  const totalKeys = correct + mistakes;
  const liveAccuracy = totalKeys > 0 ? Math.round((correct / totalKeys) * 100) : 100;

  let progressText = '';
  if (currentConfig.kind === 'time') {
    const remaining = Math.max(0, currentConfig.seconds - Math.floor(elapsedSec));
    progressText = `${remaining}s`;
  } else {
    const completed = promptResults.value.length;
    progressText = `${completed} / ${currentConfig.prompts}`;
  }

  return (
    <div className="w-full flex items-center justify-between text-xs text-text-dim px-2 border-b border-border/50 pb-2">
      <div className="flex items-center gap-4">
        <span className="font-mono text-accent text-sm font-normal">{progressText}</span>
        {currentPhase === 'running' && (
          <>
            <span className="font-mono font-normal">
              {liveWpm} <span className="text-[10px] text-text-dim uppercase">wpm</span>
            </span>
            <span className="font-mono font-normal">{liveAccuracy}%</span>
          </>
        )}
      </div>
      <div className="text-[11px] text-text-dim">
        {strictness === 'ime' ? t('config.strictness.ime') : t('config.strictness.learner')}
      </div>
    </div>
  );
}
