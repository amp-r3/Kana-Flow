import { effect, untracked } from '@preact/signals';
import {
  scriptSetting,
  contentSetting,
  strictnessSetting,
  rowIdsSetting,
  weakFocusSetting,
  testConfig,
} from '@/entities/settings';

/**
 * Calls `onReset` whenever one of the six practice and test settings changes, but not for the
 * values present when it is set up. The settings slice cannot reset a session itself, so this is
 * where a change of setting ends the running test.
 */
export function setupSettingsResetWatcher(onReset: () => void): () => void {
  let isFirstRun = true;

  const dispose = effect(() => {
    // Track all 6 practice and session configuration signals
    const _tracked = [
      scriptSetting.value,
      contentSetting.value,
      strictnessSetting.value,
      rowIdsSetting.value,
      weakFocusSetting.value,
      testConfig.value,
    ];

    if (_tracked.length > 0 && isFirstRun) {
      isFirstRun = false;
      return;
    }

    untracked(onReset);
  });

  return dispose;
}
