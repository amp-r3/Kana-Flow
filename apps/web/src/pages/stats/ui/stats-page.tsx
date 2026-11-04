import type { JSX } from 'preact';
import { t } from '@/shared/i18n';

// A placeholder until the screen is built (see docs/spec/phases.md).
export function StatsPage(): JSX.Element {
  return (
    <section className="max-w-layout-test mx-auto flex w-full flex-col gap-4 py-12">
      <h1 className="text-ui-title text-fur">{t('page.stats')}</h1>
      <p role="status" className="text-fur-dim text-ui-body">
        {t('page.stub')}
      </p>
    </section>
  );
}
