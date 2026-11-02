import type { JSX } from 'preact';
import { t } from '@/shared/i18n';

export type WeakKanaItem = {
  readonly key: string;
  readonly glyph: string;
  readonly romaji: string;
  readonly mistakes: number;
};

export type WeakestKanaListProps = {
  readonly items: readonly WeakKanaItem[];
};

export function WeakestKanaList({ items }: WeakestKanaListProps): JSX.Element | null {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="bg-surface border-border flex flex-col gap-2 rounded-lg border p-3">
      <span className="text-text-dim text-xs font-normal">{t('results.weakest')}</span>
      <div className="flex flex-wrap items-center gap-2">
        {items.map((item) => (
          <div
            key={item.key}
            className="bg-surface-2 border-border flex items-center gap-1.5 rounded border px-2.5 py-1"
          >
            <span className="font-kana text-text text-base font-bold">{item.glyph}</span>
            <span className="text-accent font-mono text-xs font-normal">{item.romaji}</span>
            <span className="text-error text-[10px] font-normal">({item.mistakes})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
