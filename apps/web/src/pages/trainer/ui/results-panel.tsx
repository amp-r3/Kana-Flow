import type { JSX } from 'preact';
import { useRef, useEffect } from 'preact/hooks';
import { t } from '@/shared/i18n';
import { Button } from '@/shared/ui';
import { canonicalFor, isKanaKey } from '@/entities/prompt';
import { metrics, promptResults } from '@/entities/session';
import { SpeedChart } from './speed-chart';
import { WeakestKanaList } from './weakest-kana-list';
import type { WeakKanaItem } from './weakest-kana-list';

export type ResultsPanelProps = {
  readonly onNextTest: () => void;
};

export function ResultsPanel({ onNextTest }: ResultsPanelProps): JSX.Element {
  const nextBtnRef = useRef<HTMLButtonElement | null>(null);
  const m = metrics.value;
  const results = promptResults.value;

  useEffect(() => {
    nextBtnRef.current?.focus();
  }, []);

  if (!m) {
    return (
      <div className="text-fur-dim max-w-layout-test mx-auto w-full py-12 text-center">
        <Button variant="primary" buttonRef={nextBtnRef} autoFocus onClick={onNextTest}>
          {t('results.nextTest')}
        </Button>
      </div>
    );
  }

  // Calculate weakest kana this run (up to 5 items with mistakes > 0)
  const mistakeMap = new Map<string, number>();
  for (const pr of results) {
    for (const token of pr.tokenOutcomes) {
      if (token.kanaKey && token.mistakes > 0) {
        const prev = mistakeMap.get(token.kanaKey) ?? 0;
        mistakeMap.set(token.kanaKey, prev + token.mistakes);
      }
    }
  }

  const weakestItems: WeakKanaItem[] = [];
  for (const [key, count] of mistakeMap.entries()) {
    const colonIdx = key.indexOf(':');
    const glyph = colonIdx >= 0 ? key.slice(colonIdx + 1) : key;
    const romaji = isKanaKey(key) ? canonicalFor(key) : '';
    weakestItems.push({
      key,
      glyph,
      romaji,
      mistakes: count,
    });
  }

  weakestItems.sort((a, b) => b.mistakes - a.mistakes);
  const topWeakest = weakestItems.slice(0, 5);
  const elapsedSec = (m.elapsedMs / 1000).toFixed(1);

  return (
    <div
      data-testid="results-panel"
      className="animate-fadeIn max-w-layout-test mx-auto flex w-full flex-col gap-6 py-6 select-none"
    >
      {/* Polite live region for screen readers (Plan 11.3 & P5 A11y) */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {t('results.summary', {
          wpm: m.wpm,
          accuracy: Math.round(m.accuracy * 100),
          prompts: m.promptsCompleted,
          mistakes: m.mistakes,
        })}
      </div>

      {/* Header with primary WPM and Accuracy */}
      <div className="border-line flex flex-wrap items-baseline justify-between gap-4 border-b pb-4">
        <div>
          <span className="text-fur-dim text-ui-caption block">{t('results.wpm')}</span>
          <span className="text-fur text-mono-hero-sm sm:text-mono-hero font-mono">{m.wpm}</span>
        </div>

        <div>
          <span className="text-fur-dim text-ui-caption block text-right">
            {t('results.accuracy')}
          </span>
          <span className="text-fur text-mono-stat text-right font-mono">
            {Math.round(m.accuracy * 100)}%
          </span>
        </div>
      </div>

      {/* Speed-over-time chart */}
      <SpeedChart series={m.wpmSeries} />

      {/* Secondary metrics grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-6">
        <div className="flex flex-col">
          <span className="text-fur-dim text-ui-caption">{t('results.rawWpm')}</span>
          <span className="text-fur text-mono-counter font-mono">{m.rawWpm}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-fur-dim text-ui-caption">{t('results.kanaPerMin')}</span>
          <span className="text-fur text-mono-counter font-mono">{m.kanaPerMin}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-fur-dim text-ui-caption">{t('results.time')}</span>
          <span className="text-fur text-mono-counter font-mono">{elapsedSec}s</span>
        </div>

        <div className="flex flex-col">
          <span className="text-fur-dim text-ui-caption">{t('results.completed')}</span>
          <span className="text-fur text-mono-counter font-mono">{m.promptsCompleted}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-fur-dim text-ui-caption">{t('results.mistakes')}</span>
          <span className="text-fur text-mono-counter font-mono">{m.mistakes}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-fur-dim text-ui-caption">{t('results.streak')}</span>
          <span className="text-fur text-mono-counter font-mono">{m.bestStreak}</span>
        </div>
      </div>

      {/* Weakest kana this run */}
      <WeakestKanaList items={topWeakest} />

      {/* Next test button (autofocused) */}
      <div className="flex items-center justify-center pt-4">
        <Button variant="primary" size="lg" buttonRef={nextBtnRef} autoFocus onClick={onNextTest}>
          {t('results.nextTest')}
        </Button>
      </div>
    </div>
  );
}
