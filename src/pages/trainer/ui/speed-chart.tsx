import type { JSX } from 'preact';

export type SpeedChartProps = {
  readonly series: readonly number[];
};

export function SpeedChart({ series }: SpeedChartProps): JSX.Element | null {
  if (series.length <= 1) {
    return null;
  }

  const svgWidth = 460;
  const svgHeight = 90;
  const paddingX = 15;
  const paddingY = 12;

  const maxVal = Math.max(10, ...series);
  const usableW = svgWidth - paddingX * 2;
  const usableH = svgHeight - paddingY * 2;

  const pts = series.map((val, idx) => {
    const x = paddingX + (idx / (series.length - 1)) * usableW;
    const y = svgHeight - paddingY - (val / maxVal) * usableH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const polylinePoints = pts.join(' ');

  return (
    <div className="w-full p-3 rounded-lg bg-surface border border-border flex flex-col gap-1">
      <span className="text-[11px] text-text-dim font-normal uppercase tracking-wider">
        Speed Over Time (WPM)
      </span>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-24 overflow-visible"
        aria-label="Speed over time graph"
      >
        <line
          x1={paddingX}
          y1={svgHeight - paddingY}
          x2={svgWidth - paddingX}
          y2={svgHeight - paddingY}
          stroke="var(--border)"
          strokeWidth="1"
        />
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
  );
}
