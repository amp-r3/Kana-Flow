import type { JSX } from 'preact';
import { t } from '@/shared/i18n';
import type { WeakKanaItem } from '@/features/training';

export type WeakestKanaListProps = {
  readonly items: readonly WeakKanaItem[];
};

export function WeakestKanaList({ items }: WeakestKanaListProps): JSX.Element | null {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-fur-dim text-ui-label">{t('results.weakest')}</span>
      <div className="flex flex-wrap items-center gap-2">
        {items.map((item) => (
          <div key={item.key} className="flex items-center gap-2 px-2.5 py-1">
            <span className="font-jp text-fur text-jp-body">{item.glyph}</span>
            <span className="text-fur-dim text-mono-small font-mono">{item.romaji}</span>
            <span className="text-miss text-mono-small font-mono">({item.mistakes})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
