import type { JSX } from 'preact';
import { useLayoutEffect, useRef } from 'preact/hooks';
import { t } from '@/shared/i18n';
import { Button } from '@/shared/ui';
import { useEnterForNext } from '@/features/training';

export type ResultsPendingProps = {
  readonly failed: boolean;
  readonly onRetry: () => void;
  readonly onNextTest: () => void;
};

/**
 * Stands in for the results screen while its chunk loads, or when it could not be loaded. Next test
 * works in both states, by button and by Enter, so a failed chunk never traps the user.
 */
export function ResultsPending({ failed, onRetry, onNextTest }: ResultsPendingProps): JSX.Element {
  const nextRef = useRef<HTMLButtonElement | null>(null);
  useEnterForNext(onNextTest);
  useLayoutEffect(() => {
    nextRef.current?.focus();
  }, []);

  return (
    <div className="max-w-layout-test mx-auto flex w-full flex-col items-center gap-4 py-12">
      {failed ? (
        <>
          <p role="alert" className="text-miss text-ui-body">
            {t('route.loadError')}
          </p>
          <Button variant="secondary" onClick={onRetry}>
            {t('route.retry')}
          </Button>
        </>
      ) : (
        <p role="status" className="text-fur-dim text-ui-label">
          {t('route.loading')}
        </p>
      )}
      <Button variant="primary" buttonRef={nextRef} onClick={onNextTest}>
        {t('results.nextTest')}
      </Button>
    </div>
  );
}
