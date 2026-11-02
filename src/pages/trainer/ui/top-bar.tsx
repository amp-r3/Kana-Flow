import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { locale, setLocale, t } from '@/shared/i18n';
import { LocalStorageStore } from '@/shared/lib';
import { Button, Dialog, Segmented, RowsIcon, ResetIcon } from '@/shared/ui';
import { resetProgress } from '@/entities/progress';

export type TopBarProps = {
  readonly onOpenRows: () => void;
};

const storage = new LocalStorageStore();

export function TopBar({ onOpenRows }: TopBarProps): JSX.Element {
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const currentLocale = locale.value;

  const handleLocaleChange = (newLoc: 'en' | 'ru') => {
    setLocale(newLoc, storage);
  };

  const handleConfirmReset = () => {
    resetProgress();
    setResetDialogOpen(false);
  };

  return (
    <header className="border-border flex w-full flex-wrap items-center justify-between gap-4 border-b py-4 select-none">
      <div className="flex items-center gap-3">
        <h1 className="text-accent flex items-center gap-2 text-xl font-normal tracking-tight">
          <span>{t('app.title')}</span>
        </h1>
        <span className="text-text-dim border-border hidden border-l pl-3 text-xs sm:inline-block">
          {t('app.tagline')}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Segmented<'en' | 'ru'>
          options={[
            { value: 'en', label: 'EN' },
            { value: 'ru', label: 'RU' },
          ]}
          value={currentLocale}
          onChange={handleLocaleChange}
          ariaLabel="Interface language"
          size="sm"
        />

        <Button variant="secondary" size="sm" onClick={onOpenRows} ariaLabel={t('app.rows')}>
          <RowsIcon size={14} />
          <span className="hidden sm:inline">{t('app.rows')}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setResetDialogOpen(true);
          }}
          ariaLabel={t('app.reset')}
        >
          <ResetIcon size={14} />
          <span className="hidden md:inline">{t('app.reset')}</span>
        </Button>
      </div>

      <Dialog
        open={resetDialogOpen}
        onClose={() => {
          setResetDialogOpen(false);
        }}
        title={t('reset.title')}
      >
        <p className="text-text-dim text-sm">{t('reset.confirm')}</p>
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            variant="ghost"
            onClick={() => {
              setResetDialogOpen(false);
            }}
          >
            {t('reset.cancel')}
          </Button>
          <Button variant="danger" onClick={handleConfirmReset}>
            {t('reset.action')}
          </Button>
        </div>
      </Dialog>
    </header>
  );
}
