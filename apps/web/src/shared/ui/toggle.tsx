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
        'text-ui-label text-fur-dim hover:text-fur pointer-coarse:min-h-touch-min inline-flex cursor-pointer items-center gap-2 transition-colors select-none',
        disabled && 'text-fur-faint hover:text-fur-faint cursor-not-allowed',
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
          'border-line-strong bg-bg-raised relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-sm border transition-colors disabled:cursor-not-allowed',
        )}
      >
        <span
          className={cx(
            'pointer-events-none my-auto inline-block h-3 w-3 transform rounded-xs transition-transform',
            checked ? 'bg-eye translate-x-4' : 'bg-fur-dim translate-x-0.5',
            disabled && 'bg-fur-faint',
          )}
        />
      </button>
      <span>{label}</span>
    </label>
  );
}
