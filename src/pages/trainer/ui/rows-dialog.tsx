import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { t } from '@/shared/i18n';
import { Dialog, Button } from '@/shared/ui';
import {
  allKanaRows,
  rowIdsSetting,
  scriptSetting,
  contentSetting,
  toggleRow,
  selectAllRows,
  clearRows,
  presetBasic,
} from '@/entities/kana';
import type { RowCategory, RowId } from '@/entities/kana';

export type RowsDialogProps = {
  readonly open: boolean;
  readonly onClose: () => void;
};

const CATEGORIES: readonly { readonly id: RowCategory; readonly label: string }[] = [
  { id: 'basic', label: 'Gojūon (Basic)' },
  { id: 'dakuten', label: 'Dakuten & Handakuten' },
  { id: 'yoon', label: 'Yōon (Digraphs)' },
  { id: 'extended', label: 'Extended Katakana' },
];

export function RowsDialog({ open, onClose }: RowsDialogProps): JSX.Element {
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const selectedRows = new Set(rowIdsSetting.value);
  const currentScript = scriptSetting.value;
  const currentContent = contentSetting.value;

  const isContentDisabled = currentContent !== 'single';
  const isHiraganaOnly = currentScript === 'hiragana';

  const handleToggle = (rowId: RowId) => {
    setWarningMessage(null);
    const success = toggleRow(rowId);
    if (!success) {
      setWarningMessage(t('dialog.atLeastOneRow'));
    }
  };

  const handleSelectAll = () => {
    setWarningMessage(null);
    selectAllRows(allKanaRows.map((r) => r.id));
  };

  const handleGojuonOnly = () => {
    setWarningMessage(null);
    presetBasic();
  };

  const handleClear = () => {
    setWarningMessage(null);
    clearRows('vowels');
  };

  return (
    <Dialog open={open} onClose={onClose} title={t('app.rows')}>
      {isContentDisabled && (
        <div className="p-3 rounded bg-surface-2 border border-accent/30 text-accent text-xs">
          {t('dialog.contentDisabled')}
        </div>
      )}

      {warningMessage && (
        <div className="p-2.5 rounded bg-error/15 border border-error/30 text-error text-xs">
          {warningMessage}
        </div>
      )}

      {/* Preset actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={handleSelectAll} disabled={isContentDisabled}>
          {t('dialog.selectAll')}
        </Button>
        <Button variant="secondary" size="sm" onClick={handleGojuonOnly} disabled={isContentDisabled}>
          {t('dialog.gojuonOnly')}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleClear} disabled={isContentDisabled}>
          {t('dialog.clear')}
        </Button>
      </div>

      {/* Categories matrix */}
      <div className="flex flex-col gap-5 py-2">
        {CATEGORIES.map((cat) => {
          const rowsInCat = allKanaRows.filter((r) => r.category === cat.id);
          const isCategoryDisabled =
            isContentDisabled || (cat.id === 'extended' && isHiraganaOnly);

          return (
            <div key={cat.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-normal text-text-dim uppercase tracking-wider">
                  {cat.label}
                </span>
                {cat.id === 'extended' && isHiraganaOnly && (
                  <span className="text-[11px] text-text-dim italic">
                    {t('dialog.extendedDisabled')}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {rowsInCat.map((row) => {
                  const isSelected = selectedRows.has(row.id);
                  const sampleKana = row.entries
                    .slice(0, 3)
                    .map((e) => (currentScript === 'katakana' ? e.katakana : e.hiragana ?? e.katakana))
                    .join(' ');

                  return (
                    <button
                      key={row.id}
                      type="button"
                      disabled={isCategoryDisabled}
                      onClick={() => {
                        handleToggle(row.id);
                      }}
                      className={`flex flex-col items-start p-2 rounded border text-left cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40 disabled:cursor-not-allowed ${
                        isSelected
                          ? 'bg-accent/15 border-accent text-accent'
                          : 'bg-surface-2 border-border text-text-dim hover:text-text hover:border-border-strong'
                      }`}
                    >
                      <span className="text-xs font-normal">{row.name}</span>
                      <span className="text-xs font-kana font-bold text-text mt-0.5">{sampleKana}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-2 border-t border-border">
        <Button variant="primary" onClick={onClose}>
          {t('dialog.close')}
        </Button>
      </div>
    </Dialog>
  );
}
