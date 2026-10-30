import type { JSX } from 'preact';
import { t } from '@/shared/i18n';
import { Button } from '@/shared/ui';
import { romajiForKey } from '@/entities/kana';
import { metrics, promptResults } from '@/entities/session';

export type ResultsPanelProps = {
  readonly onNextTest: () => void;
};

type WeakKanaItem = {
  readonly key: string;
  readonly glyph: string;
  readonly romaji: string;
  readonly mistakes: number;
};

export function ResultsPanel({ onNextTest }: ResultsPanelProps): JSX.Element {
  const m = metrics.value;
  const results = promptResults.value;

  if (!m) {
    return (
      <div className="w-full max-w-xl mx-auto py-12 text-center text-text-dim">
        <Button variant="primary" autoFocus onClick={onNextTest}>
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

  // Speed-over-time SVG polyline calculation
  const series = m.wpmSeries;
  const svgWidth = 460;
  const svgHeight = 90;
  const paddingX = 15;
  const paddingY = 12;

  let polylinePoints = '';
  if (series.length > 1) {
    const maxVal = Math.max(10, ...series);
    const usableW = svgWidth - paddingX * 2;
    const usableH = svgHeight - paddingY * 2;

    const pts = series.map((val, idx) => {
      const x = paddingX + (idx / (series.length - 1)) * usableW;
      const y = svgHeight - paddingY - (val / maxVal) * usableH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    polylinePoints = pts.join(' ');
  }

  const elapsedSec = (m.elapsedMs / 1000).toFixed(1);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 py-6 select-none animate-fadeIn">
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
      {series.length > 1 && (
        <div className="w-full p-3 rounded-lg bg-surface border border-border flex flex-col gap-1">
          <span className="text-[11px] text-text-dim font-normal uppercase tracking-wider">
            Speed Over Time (WPM)
          </span>
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-24 overflow-visible"
            aria-label="Speed over time graph"
          >
            {/* Baseline */}
            <line
              x1={paddingX}
              y1={svgHeight - paddingY}
              x2={svgWidth - paddingX}
              y2={svgHeight - paddingY}
              stroke="var(--border)"
              strokeWidth="1"
            />
            {/* WPM Polyline */}
            <polyline
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polylinePoints}
            />
          </svg>
        </div>
      )}

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
      {topWeakest.length > 0 && (
        <div className="flex flex-col gap-2 p-3 rounded-lg bg-surface border border-border">
          <span className="text-xs text-text-dim font-normal">
            {t('results.weakest')}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {topWeakest.map((item) => (
              <div
                key={item.key}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-2 border border-border"
              >
                <span className="font-kana font-bold text-base text-text">{item.glyph}</span>
                <span className="font-mono text-xs text-accent font-normal">{item.romaji}</span>
                <span className="text-[10px] text-error font-normal">({item.mistakes})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next test button (autofocused) */}
      <div className="flex items-center justify-center pt-4">
        <Button variant="primary" size="lg" autoFocus onClick={onNextTest}>
          {t('results.nextTest')}
        </Button>
      </div>
    </div>
  );
}
