import type { JSX } from 'preact';
import { cx } from '../lib';

export type ToggleProps = {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly label: string;
  readonly disabled?: boolean;
};

export function Toggle({ checked, onChange, label, disabled = false }: ToggleProps): JSX.Element {
  return (
    <label
      className={cx(
        'text-text-dim hover:text-text inline-flex cursor-pointer items-center gap-2 text-xs font-normal transition-colors select-none',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => {
          onChange(!checked);
        }}
        className={cx(
          'border-border focus-visible:ring-accent relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border transition-colors outline-none focus-visible:ring-2 disabled:cursor-not-allowed',
          checked ? 'bg-accent border-accent' : 'bg-surface-2',
        )}
      >
        <span
          className={cx(
            'bg-bg pointer-events-none my-auto mt-[1px] inline-block h-3 w-3 transform rounded-full shadow-sm transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0.5',
          )}
        />
      </button>
      <span>{label}</span>
    </label>
  );
}
