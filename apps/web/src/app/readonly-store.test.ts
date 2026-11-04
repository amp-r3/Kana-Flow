import { describe, it, expect } from 'vitest';
import {
  scriptSetting,
  contentSetting,
  strictnessSetting,
  rowIdsSetting,
  weakFocusSetting,
  testConfig,
} from '@/entities/settings';
import {
  phase,
  metrics,
  keystrokes,
  promptResults,
  correctKeystrokes,
  mistakeCount,
  sessionStartedAt,
} from '@/entities/session';
import { progressStats } from '@/entities/stats';
import { TypingController } from '@/features/training';
import { locale } from '@/shared/i18n';

// Compile-checked type helper: verifies property 'value' is readonly without @ts-expect-error
type IfEquals<X, Y, A = true, B = false> =
  (<T>(x: T) => T extends X ? 1 : 2) extends <T>(x: T) => T extends Y ? 1 : 2 ? A : B;

type IsWritable<T, K extends keyof T> = IfEquals<{ [Q in K]: T[Q] }, { -readonly [Q in K]: T[Q] }>;

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
export type _CheckKeystrokes = AssertFalse<IsWritable<typeof keystrokes, 'value'>>;
export type _CheckPromptResults = AssertFalse<IsWritable<typeof promptResults, 'value'>>;
export type _CheckCorrectKeystrokes = AssertFalse<IsWritable<typeof correctKeystrokes, 'value'>>;
export type _CheckMistakeCount = AssertFalse<IsWritable<typeof mistakeCount, 'value'>>;
export type _CheckSessionStartedAt = AssertFalse<IsWritable<typeof sessionStartedAt, 'value'>>;
export type _CheckProgressStats = AssertFalse<IsWritable<typeof progressStats, 'value'>>;
export type _CheckLocale = AssertFalse<IsWritable<typeof locale, 'value'>>;

// Controller signal checks:
export type _CheckCtrlTypedBuffer = AssertFalse<
  IsWritable<TypingController['typedBuffer'], 'value'>
>;
export type _CheckCtrlIsShaking = AssertFalse<IsWritable<TypingController['isShaking'], 'value'>>;
export type _CheckCtrlIsAssisted = AssertFalse<IsWritable<TypingController['isAssisted'], 'value'>>;
export type _CheckCtrlImeNotice = AssertFalse<IsWritable<TypingController['imeNotice'], 'value'>>;
export type _CheckCtrlCurrentPrompt = AssertFalse<
  IsWritable<TypingController['currentPrompt'], 'value'>
>;
export type _CheckCtrlActiveTokenIdx = AssertFalse<
  IsWritable<TypingController['activeTokenIdx'], 'value'>
>;
export type _CheckCtrlCanonicalRomaji = AssertFalse<
  IsWritable<TypingController['canonicalRomaji'], 'value'>
>;
export type _CheckCtrlTickerNow = AssertFalse<IsWritable<TypingController['tickerNow'], 'value'>>;

describe('store state: ReadonlySignal guarantees', () => {
  it('all store signals and controller signals are exposed as ReadonlySignal', () => {
    // Runtime confirmation that signals are defined and readable
    expect(scriptSetting.value).toBeDefined();
    expect(contentSetting.value).toBeDefined();
    expect(strictnessSetting.value).toBeDefined();
    expect(rowIdsSetting.value).toBeDefined();
    expect(weakFocusSetting.value).toBeDefined();
    expect(testConfig.value).toBeDefined();
    expect(phase.value).toBeDefined();
    expect(metrics.value).toBeNull();
    expect(keystrokes.value).toBeDefined();
    expect(promptResults.value).toBeDefined();
    expect(correctKeystrokes.value).toBeDefined();
    expect(mistakeCount.value).toBeDefined();
    expect(sessionStartedAt.value).toBeDefined();
    expect(progressStats.value).toBeDefined();
    expect(locale.value).toBeDefined();

    const dummyController = new TypingController(() => ({ key: 'basic:a', text: 'あ' }));
    expect(dummyController.typedBuffer.value).toBeDefined();
    expect(dummyController.isShaking.value).toBeDefined();
    expect(dummyController.isAssisted.value).toBeDefined();
    expect(dummyController.imeNotice.value).toBeDefined();
    expect(dummyController.currentPrompt.value).toBeNull();
    expect(dummyController.activeTokenIdx.value).toBeDefined();
    expect(dummyController.canonicalRomaji.value).toBeDefined();
    expect(dummyController.tickerNow.value).toBeDefined();
  });
});
