import type { JSX } from 'preact';
import { useRef, useEffect } from 'preact/hooks';
import { t } from '@/shared/i18n';
import { Button } from '@/shared/ui';
import { romajiForKey } from '@/entities/kana';
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
      <div className="text-text-dim mx-auto w-full max-w-xl py-12 text-center">
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
    const romaji = romajiForKey(key) ?? '';
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
    <div className="animate-fadeIn mx-auto flex w-full max-w-2xl flex-col gap-6 py-6 select-none">
      {/* Polite live region for screen readers (Plan 11.3 & P5 A11y) */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {`Test complete. Speed: ${m.wpm} WPM, accuracy: ${Math.round(m.accuracy * 100)} percent. Completed ${m.promptsCompleted} prompts with ${m.mistakes} mistakes.`}
      </div>

      {/* Header with primary WPM and Accuracy */}
      <div className="border-border flex flex-wrap items-baseline justify-between gap-4 border-b pb-4">
        <div>
          <span className="text-text-dim block text-xs font-normal tracking-wider uppercase">
            {t('results.wpm')}
          </span>
          <span className="text-accent font-mono text-5xl font-normal tracking-tight md:text-6xl">
            {m.wpm}
          </span>
        </div>

        <div>
          <span className="text-text-dim block text-right text-xs font-normal tracking-wider uppercase">
            {t('results.accuracy')}
          </span>
          <span className="text-text text-right font-mono text-4xl font-normal md:text-5xl">
            {Math.round(m.accuracy * 100)}%
          </span>
        </div>
      </div>

      {/* Speed-over-time chart */}
      <SpeedChart series={m.wpmSeries} />

      {/* Secondary metrics grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
        <div className="bg-surface border-border flex flex-col rounded border p-3">
          <span className="text-text-dim text-[11px]">{t('results.rawWpm')}</span>
          <span className="text-text mt-0.5 font-mono text-lg font-normal">{m.rawWpm}</span>
        </div>

        <div className="bg-surface border-border flex flex-col rounded border p-3">
          <span className="text-text-dim text-[11px]">{t('results.kanaPerMin')}</span>
          <span className="text-text mt-0.5 font-mono text-lg font-normal">{m.kanaPerMin}</span>
        </div>

        <div className="bg-surface border-border flex flex-col rounded border p-3">
          <span className="text-text-dim text-[11px]">{t('results.time')}</span>
          <span className="text-text mt-0.5 font-mono text-lg font-normal">{elapsedSec}s</span>
        </div>

        <div className="bg-surface border-border flex flex-col rounded border p-3">
          <span className="text-text-dim text-[11px]">{t('results.completed')}</span>
          <span className="text-text mt-0.5 font-mono text-lg font-normal">
            {m.promptsCompleted}
          </span>
        </div>

        <div className="bg-surface border-border flex flex-col rounded border p-3">
          <span className="text-text-dim text-[11px]">{t('results.mistakes')}</span>
          <span className="text-text mt-0.5 font-mono text-lg font-normal">{m.mistakes}</span>
        </div>

        <div className="bg-surface border-border flex flex-col rounded border p-3">
          <span className="text-text-dim text-[11px]">{t('results.streak')}</span>
          <span className="text-text mt-0.5 font-mono text-lg font-normal">{m.bestStreak}</span>
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
