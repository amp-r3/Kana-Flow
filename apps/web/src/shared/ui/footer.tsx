import type { JSX } from 'preact';
import { Link } from './link';

export type FooterProps = {
  readonly aboutHref: string;
  readonly aboutLabel: string;
  readonly currentPath: string;
  readonly onNavigate: (href: string) => void;
};

export function Footer({
  aboutHref,
  aboutLabel,
  currentPath,
  onNavigate,
}: FooterProps): JSX.Element {
  return (
    <footer className="flex w-full justify-center pt-12">
      <Link
        href={aboutHref}
        onNavigate={onNavigate}
        current={currentPath === aboutHref}
        className="text-ui-caption text-fur-dim hover:text-fur pointer-coarse:min-h-touch-min inline-flex items-center px-3"
      >
        {aboutLabel}
      </Link>
    </footer>
  );
}
