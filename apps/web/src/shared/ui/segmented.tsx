import type { JSX } from 'preact';
import { cx } from '../lib';

export type SegmentedOption<T extends string | number> = {
  readonly value: T;
  readonly label: string;
};

export type SegmentedProps<T extends string | number> = {
  readonly options: readonly SegmentedOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly ariaLabel?: string;
  readonly disabled?: boolean;
  readonly size?: 'sm' | 'md';
};

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  ariaLabel,
  disabled = false,
  size = 'sm',
}: SegmentedProps<T>): JSX.Element {
  const padClass = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm';

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="bg-surface border-border inline-flex gap-0.5 rounded border p-0.5 select-none"
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => {
              console.log('Segmented button onClick, opt =', opt.value);
              if (opt.value !== value) {
                onChange(opt.value);
              }
            }}
            className={cx(
              'focus-visible:ring-accent cursor-pointer rounded font-normal transition-colors outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
              padClass,
              isSelected ? 'bg-accent text-bg' : 'text-text-dim hover:text-text hover:bg-surface-2',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
