import type { ReadonlySignal } from '@preact/signals';
import { signal } from '@preact/signals';
import type { ResultsPanel } from './ui/results-panel';

// The results screen is a chunk of its own: it shows only when a test ends.
const _panel = signal<typeof ResultsPanel | null>(null);
const _failed = signal(false);
let inflight: Promise<void> | undefined;

export const resultsPanel: ReadonlySignal<typeof ResultsPanel | null> = _panel;
export const resultsLoadFailed: ReadonlySignal<boolean> = _failed;

/** Loads the results screen once. A failure is recorded, not thrown, and a later call retries. */
export function loadResultsPanel(): Promise<void> {
  if (_panel.value !== null) return Promise.resolve();
  if (inflight !== undefined) return inflight;

  _failed.value = false;
  inflight = import('./ui/results-panel')
    .then((module) => {
      _panel.value = module.ResultsPanel;
    })
    .catch(() => {
      _failed.value = true;
    })
    .finally(() => {
      inflight = undefined;
    });
  return inflight;
}
