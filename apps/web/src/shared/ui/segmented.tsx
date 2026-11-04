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
  const sizeClass = size === 'sm' ? 'h-control-sm px-2' : 'h-control px-3';

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex flex-wrap gap-1 select-none"
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
              if (opt.value !== value) {
                onChange(opt.value);
              }
            }}
            className={cx(
              'text-ui-label pointer-coarse:min-h-touch-min disabled:text-fur-faint relative cursor-pointer rounded-sm whitespace-nowrap transition-colors disabled:cursor-not-allowed',
              sizeClass,
              isSelected
                ? 'text-fur after:bg-eye after:absolute after:inset-x-2 after:bottom-0 after:h-0.5'
                : 'text-fur-dim hover:text-fur hover:bg-bg-hover',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
