import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { t } from '@/shared/i18n';
import { Dialog, Button } from '@/shared/ui';
import { allKanaRows } from '@/entities/prompt';
import {
  rowIdsSetting,
  scriptSetting,
  toggleRow,
  selectAllRows,
  clearRows,
  presetBasic,
} from '@/entities/settings';
import type { RowCategory, RowId } from '@/entities/prompt';

export type RowsDialogProps = {
  readonly open: boolean;
  readonly onClose: () => void;
};

const CATEGORIES: readonly RowCategory[] = ['basic', 'dakuten', 'yoon', 'extended'];

export function RowsDialog({ open, onClose }: RowsDialogProps): JSX.Element {
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const selectedRows = new Set(rowIdsSetting.value);
  const currentScript = scriptSetting.value;

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
    <Dialog open={open} onClose={onClose} title={t('app.rows')} closeLabel={t('dialog.close')}>
      {warningMessage && <div className="text-miss text-ui-label">{warningMessage}</div>}

      {/* Preset actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={handleSelectAll}>
          {t('dialog.selectAll')}
        </Button>
        <Button variant="secondary" size="sm" onClick={handleGojuonOnly}>
          {t('dialog.gojuonOnly')}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleClear}>
          {t('dialog.clear')}
        </Button>
      </div>

      {/* Categories matrix */}
      <div className="flex flex-col gap-5 py-2">
        {CATEGORIES.map((cat) => {
          const rowsInCat = allKanaRows.filter((r) => r.category === cat);
          const isCategoryDisabled = cat === 'extended' && isHiraganaOnly;

          return (
            <div key={cat} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-fur-dim text-ui-label">{t(`rows.category.${cat}`)}</span>
                {cat === 'extended' && isHiraganaOnly && (
                  <span className="text-fur-dim text-ui-caption">
                    {t('dialog.extendedDisabled')}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {rowsInCat.map((row) => {
                  const isSelected = selectedRows.has(row.id);
                  const sampleKana = row.entries
                    .slice(0, 3)
                    .map((e) =>
                      currentScript === 'katakana' ? e.katakana : (e.hiragana ?? e.katakana),
                    )
                    .join(' ');

                  return (
                    <button
                      key={row.id}
                      type="button"
                      disabled={isCategoryDisabled}
                      onClick={() => {
                        handleToggle(row.id);
                      }}
                      className={`hover:bg-bg-hover pointer-coarse:min-h-touch-min disabled:text-fur-faint flex cursor-pointer flex-col items-start rounded-sm border p-2 text-left transition-colors disabled:cursor-not-allowed ${
                        isSelected ? 'border-eye text-fur' : 'text-fur-dim border-transparent'
                      }`}
                    >
                      <span className="text-ui-label">{row.name}</span>
                      <span className="font-jp text-jp-cell-sm text-fur mt-0.5">{sampleKana}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-line flex justify-end border-t pt-2">
        <Button variant="primary" onClick={onClose}>
          {t('dialog.close')}
        </Button>
      </div>
    </Dialog>
  );
}
