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
      <div className="w-full max-w-xl mx-auto py-12 text-center text-text-dim">
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
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 py-6 select-none animate-fadeIn">
      {/* Polite live region for screen readers (Plan 11.3 & P5 A11y) */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {`Test complete. Speed: ${m.wpm} WPM, accuracy: ${Math.round(m.accuracy * 100)} percent. Completed ${m.promptsCompleted} prompts with ${m.mistakes} mistakes.`}
      </div>

      {/* Header with primary WPM and Accuracy */}
      <div className="flex flex-wrap items-baseline justify-between border-b border-border pb-4 gap-4">
        <div>
          <span className="text-xs text-text-dim uppercase tracking-wider block font-normal">
            {t('results.wpm')}
          </span>
          <span className="font-mono text-5xl md:text-6xl text-accent font-normal tracking-tight">
            {m.wpm}
          </span>
        </div>

        <div>
          <span className="text-xs text-text-dim uppercase tracking-wider block font-normal text-right">
            {t('results.accuracy')}
          </span>
          <span className="font-mono text-4xl md:text-5xl text-text font-normal text-right">
            {Math.round(m.accuracy * 100)}%
          </span>
        </div>
      </div>

      {/* Speed-over-time chart */}
      <SpeedChart series={m.wpmSeries} />

      {/* Secondary metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        <div className="p-3 rounded bg-surface border border-border flex flex-col">
          <span className="text-[11px] text-text-dim">{t('results.rawWpm')}</span>
          <span className="font-mono text-lg font-normal text-text mt-0.5">{m.rawWpm}</span>
        </div>

        <div className="p-3 rounded bg-surface border border-border flex flex-col">
          <span className="text-[11px] text-text-dim">{t('results.kanaPerMin')}</span>
          <span className="font-mono text-lg font-normal text-text mt-0.5">{m.kanaPerMin}</span>
        </div>

        <div className="p-3 rounded bg-surface border border-border flex flex-col">
          <span className="text-[11px] text-text-dim">{t('results.time')}</span>
          <span className="font-mono text-lg font-normal text-text mt-0.5">{elapsedSec}s</span>
        </div>

        <div className="p-3 rounded bg-surface border border-border flex flex-col">
          <span className="text-[11px] text-text-dim">{t('results.completed')}</span>
          <span className="font-mono text-lg font-normal text-text mt-0.5">{m.promptsCompleted}</span>
        </div>

        <div className="p-3 rounded bg-surface border border-border flex flex-col">
          <span className="text-[11px] text-text-dim">{t('results.mistakes')}</span>
          <span className="font-mono text-lg font-normal text-text mt-0.5">{m.mistakes}</span>
        </div>

        <div className="p-3 rounded bg-surface border border-border flex flex-col">
          <span className="text-[11px] text-text-dim">{t('results.streak')}</span>
          <span className="font-mono text-lg font-normal text-text mt-0.5">{m.bestStreak}</span>
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
