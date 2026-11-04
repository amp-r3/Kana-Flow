import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { locale, setLocale, t } from '@/shared/i18n';
import { Button, Dialog, Segmented, RowsIcon, ResetIcon } from '@/shared/ui';
import { resetProgress } from '@/entities/stats';
import lockupUrl from '@/assets/logo/lockup.svg';

export type TopBarProps = {
  readonly onOpenRows: () => void;
};

export function TopBar({ onOpenRows }: TopBarProps): JSX.Element {
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const currentLocale = locale.value;

  const handleLocaleChange = (newLoc: 'en' | 'ru') => {
    setLocale(newLoc);
  };

  const handleConfirmReset = () => {
    resetProgress();
    setResetDialogOpen(false);
  };

  return (
    <header className="border-line flex w-full flex-wrap items-center justify-between gap-4 border-b py-4 select-none">
      <div className="flex items-center gap-3">
        <h1 className="text-ui-heading text-fur flex items-center gap-2">
          <img src={lockupUrl} alt={t('app.title')} width="138" height="28" />
        </h1>
        <span className="text-fur-dim border-line text-ui-caption hidden border-l pl-3 sm:inline-block">
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
          ariaLabel={t('app.language')}
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
          <span className="hidden sm:inline">{t('app.reset')}</span>
        </Button>
      </div>

      <Dialog
        open={resetDialogOpen}
        closeLabel={t('dialog.close')}
        onClose={() => {
          setResetDialogOpen(false);
        }}
        title={t('reset.title')}
      >
        <p className="text-fur-dim text-ui-body">{t('reset.confirm')}</p>
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
