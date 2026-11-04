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
        'border-line-strong text-fur-dim text-mono-small inline-flex items-center justify-center rounded-sm border px-1.5 py-0.5 font-mono',
        className,
      )}
    >
      {children}
    </kbd>
  );
}
