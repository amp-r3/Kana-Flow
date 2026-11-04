import type { ComponentChildren, JSX } from 'preact';
import { isPlainLeftClick } from '../lib';

export type LinkProps = {
  readonly href: string;
  // Called instead of loading the page; the browser still handles new tabs and modified clicks.
  readonly onNavigate: (href: string) => void;
  readonly children: ComponentChildren;
  readonly className?: string;
  readonly current?: boolean;
};

export function Link({
  href,
  onNavigate,
  children,
  className,
  current = false,
}: LinkProps): JSX.Element {
  return (
    <a
      href={href}
      aria-current={current ? 'page' : undefined}
      className={className}
      onClick={(event) => {
        if (!isPlainLeftClick(event)) return;
        event.preventDefault();
        onNavigate(href);
      }}
    >
      {children}
    </a>
  );
}
