import type { ComponentChildren, JSX } from 'preact';
import { cx } from '../lib';

export type KbdProps = {
  readonly children: ComponentChildren;
  readonly className?: string;
};

export function Kbd({ children, className = '' }: KbdProps): JSX.Element {
  return (
    <kbd
      className={cx(
        'bg-surface-2 border-border text-text-dim inline-flex items-center justify-center rounded border px-1.5 py-0.5 text-[11px] leading-none font-normal shadow-xs',
        className,
      )}
    >
      {children}
    </kbd>
  );
}
