import type { ComponentChildren, JSX, Ref } from 'preact';
import { cx } from '../lib';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly children: ComponentChildren;
  readonly onClick?: (e: MouseEvent) => void;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly type?: 'button' | 'submit' | 'reset';
  readonly autoFocus?: boolean;
  readonly ariaLabel?: string;
  readonly buttonRef?: Ref<HTMLButtonElement>;
};

export function Button({
  variant = 'secondary',
  size = 'md',
  children,
  onClick,
  disabled = false,
  className = '',
  type = 'button',
  autoFocus = false,
  ariaLabel,
  buttonRef,
}: ButtonProps): JSX.Element {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded font-normal transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 select-none outline-none focus-visible:ring-2';

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-1 text-xs'
      : size === 'lg'
        ? 'px-5 py-2.5 text-base'
        : 'px-3 py-1.5 text-sm';

  const variantClasses =
    variant === 'primary'
      ? 'bg-accent text-bg font-normal hover:brightness-110 focus-visible:ring-accent'
      : variant === 'ghost'
        ? 'bg-transparent text-text-dim hover:text-text hover:bg-surface-2 focus-visible:ring-accent'
        : variant === 'danger'
          ? 'bg-error/15 text-error border border-error/30 hover:bg-error/25 focus-visible:ring-error'
          : 'bg-surface-2 text-text border border-border hover:border-border-strong focus-visible:ring-accent';

  if (buttonRef !== undefined) {
    return (
      <button
        ref={buttonRef}
        type={type}
        disabled={disabled}
        onClick={onClick}
        autoFocus={autoFocus}
        aria-label={ariaLabel}
        className={cx(base, sizeClasses, variantClasses, className)}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      autoFocus={autoFocus}
      aria-label={ariaLabel}
      className={cx(base, sizeClasses, variantClasses, className)}
    >
      {children}
    </button>
  );
}
