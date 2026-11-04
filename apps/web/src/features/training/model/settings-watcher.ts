import { effect, untracked } from '@preact/signals';
import {
  scriptSetting,
  contentSetting,
  strictnessSetting,
  rowIdsSetting,
  weakFocusSetting,
  testConfig,
} from '@/entities/settings';
import { resetSession } from '@/entities/session';

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

    untracked(() => {
      resetSession();
      onReset();
    });
  });

  return dispose;
}
