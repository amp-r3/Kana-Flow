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
        'inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-normal leading-none rounded bg-surface-2 border border-border text-text-dim shadow-xs',
        className,
      )}
    >
      {children}
    </kbd>
  );
}
