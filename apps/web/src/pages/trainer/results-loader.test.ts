import { describe, it, expect, vi } from 'vitest';
import { loadResultsPanel, prefetchResultsPanel, resultsLoadFailed } from './results-loader';

// The results chunk cannot be fetched.
vi.mock('./ui/results-panel', () => {
  throw new Error('offline');
});

describe('results loader', () => {
  // Spec "Loading": a failed prefetch is ignored; the screen reports an error itself when it is
  // opened. A failure left behind by the prefetch would show on the results screen for a moment.
  it('a failed prefetch reports nothing, and a load for the screen reports its own failure', async () => {
    await prefetchResultsPanel();
    expect(resultsLoadFailed.value).toBe(false);

    const loading = loadResultsPanel();
    expect(resultsLoadFailed.value).toBe(false);
    await loading;
    expect(resultsLoadFailed.value).toBe(true);
  });
});
