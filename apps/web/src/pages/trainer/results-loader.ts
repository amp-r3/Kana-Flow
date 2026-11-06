import type { ReadonlySignal } from '@preact/signals';
import { signal } from '@preact/signals';
import type { ResultsPanel } from './ui/results-panel';

// The results screen is a chunk of its own: it shows only when a test ends.
const _panel = signal<typeof ResultsPanel | null>(null);
const _failed = signal(false);
// One request at a time; it resolves to whether the chunk arrived.
let inflight: Promise<boolean> | undefined;

export const resultsPanel: ReadonlySignal<typeof ResultsPanel | null> = _panel;
export const resultsLoadFailed: ReadonlySignal<boolean> = _failed;

function fetchPanel(): Promise<boolean> {
  if (_panel.value !== null) return Promise.resolve(true);
  if (inflight !== undefined) return inflight;
  const request = import('./ui/results-panel')
    .then((module) => {
      _panel.value = module.ResultsPanel;
      return true;
    })
    .catch(() => false)
    .finally(() => {
      inflight = undefined;
    });
  inflight = request;
  return request;
}

/**
 * Loads the results screen for a test that has ended. A failure is recorded, not thrown, and a
 * later call retries.
 */
export async function loadResultsPanel(): Promise<void> {
  if (_panel.value !== null) return;
  _failed.value = false;
  if (!(await fetchPanel())) _failed.value = true;
}

/**
 * Fetches the results screen ahead of time. A failure is not recorded: the screen loads again and
 * reports an error itself when a test ends (spec "Loading").
 */
export async function prefetchResultsPanel(): Promise<void> {
  await fetchPanel();
}
