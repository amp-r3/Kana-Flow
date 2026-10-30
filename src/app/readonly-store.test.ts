import { describe, it, expect } from 'vitest';
import {
  scriptSetting,
  contentSetting,
  strictnessSetting,
  rowIdsSetting,
  weakFocusSetting,
} from '@/entities/kana';
import { testConfig, phase, metrics } from '@/entities/session';
import { progressStats } from '@/entities/progress';
import { locale } from '@/shared/i18n';

// Compile-checked type helper: verifies property 'value' is readonly without @ts-expect-error
type IfEquals<X, Y, A = true, B = false> =
  (<T>(x: T) => T extends X ? 1 : 2) extends
  (<T>(x: T) => T extends Y ? 1 : 2) ? A : B;

type IsWritable<T, K extends keyof T> =
  IfEquals<{ [Q in K]: T[Q] }, { -readonly [Q in K]: T[Q] }>;

type AssertFalse<T extends false> = T;

// Static type assertions: these fail compilation (tsc --noEmit) if .value is writable
export type _CheckScriptSetting = AssertFalse<IsWritable<typeof scriptSetting, 'value'>>;
export type _CheckContentSetting = AssertFalse<IsWritable<typeof contentSetting, 'value'>>;
export type _CheckStrictnessSetting = AssertFalse<IsWritable<typeof strictnessSetting, 'value'>>;
export type _CheckRowIdsSetting = AssertFalse<IsWritable<typeof rowIdsSetting, 'value'>>;
export type _CheckWeakFocusSetting = AssertFalse<IsWritable<typeof weakFocusSetting, 'value'>>;
export type _CheckTestConfig = AssertFalse<IsWritable<typeof testConfig, 'value'>>;
export type _CheckPhase = AssertFalse<IsWritable<typeof phase, 'value'>>;
export type _CheckMetrics = AssertFalse<IsWritable<typeof metrics, 'value'>>;
export type _CheckProgressStats = AssertFalse<IsWritable<typeof progressStats, 'value'>>;
export type _CheckLocale = AssertFalse<IsWritable<typeof locale, 'value'>>;

describe('store state: ReadonlySignal guarantees', () => {
  it('all store signals are exposed as ReadonlySignal', () => {
    // Runtime confirmation that signals are defined and readable
    expect(scriptSetting.value).toBeDefined();
    expect(contentSetting.value).toBeDefined();
    expect(strictnessSetting.value).toBeDefined();
    expect(rowIdsSetting.value).toBeDefined();
    expect(weakFocusSetting.value).toBeDefined();
    expect(testConfig.value).toBeDefined();
    expect(phase.value).toBeDefined();
    expect(metrics.value).toBeNull();
    expect(progressStats.value).toBeDefined();
    expect(locale.value).toBeDefined();
  });
});
