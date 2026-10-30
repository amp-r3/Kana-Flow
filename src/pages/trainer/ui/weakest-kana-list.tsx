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
    <div className="flex flex-col gap-2 p-3 rounded-lg bg-surface border border-border">
      <span className="text-xs text-text-dim font-normal">{t('results.weakest')}</span>
      <div className="flex flex-wrap items-center gap-2">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-2 border border-border"
          >
            <span className="font-kana font-bold text-base text-text">{item.glyph}</span>
            <span className="font-mono text-xs text-accent font-normal">{item.romaji}</span>
            <span className="text-[10px] text-error font-normal">({item.mistakes})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
