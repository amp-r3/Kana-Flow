import type { JSX } from 'preact';
import { cx } from '../lib';

export type ToggleProps = {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly label: string;
  readonly disabled?: boolean;
};

export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
}: ToggleProps): JSX.Element {
  return (
    <label
      className={cx(
        'inline-flex items-center gap-2 cursor-pointer select-none text-xs font-normal text-text-dim hover:text-text transition-colors',
        disabled && 'opacity-50 cursor-not-allowed',
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
          'relative inline-flex h-4 w-8 shrink-0 rounded-full border border-border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer disabled:cursor-not-allowed',
          checked ? 'bg-accent border-accent' : 'bg-surface-2',
        )}
      >
        <span
          className={cx(
            'pointer-events-none inline-block h-3 w-3 transform rounded-full bg-bg shadow-sm transition-transform my-auto mt-[1px]',
            checked ? 'translate-x-4' : 'translate-x-0.5',
          )}
        />
      </button>
      <span>{label}</span>
    </label>
  );
}
