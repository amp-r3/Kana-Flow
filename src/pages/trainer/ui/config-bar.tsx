import type { JSX } from 'preact';
import { t } from '@/shared/i18n';
import { Segmented, Toggle } from '@/shared/ui';
import {
  scriptSetting,
  contentSetting,
  strictnessSetting,
  weakFocusSetting,
  setScript,
  setContent,
  setStrictness,
  setWeakFocus,
} from '@/entities/kana';
import type { ScriptMode, ContentKind, Strictness } from '@/entities/kana';
import { testConfig, setTestConfig } from '@/entities/session';

export type ConfigBarProps = {
  readonly onSettingChange: () => void;
};

export function ConfigBar({ onSettingChange }: ConfigBarProps): JSX.Element {
  const currentScript = scriptSetting.value;
  const currentContent = contentSetting.value;
  const currentStrictness = strictnessSetting.value;
  const currentWeakFocus = weakFocusSetting.value;
  const currentTestConfig = testConfig.value;

  const handleScriptChange = (val: ScriptMode) => {
    setScript(val);
    onSettingChange();
  };

  const handleContentChange = (val: ContentKind) => {
    setContent(val);
    onSettingChange();
  };

  const handleStrictnessChange = (val: Strictness) => {
    setStrictness(val);
    onSettingChange();
  };

  const handleWeakFocusChange = (val: boolean) => {
    setWeakFocus(val);
    onSettingChange();
  };

  const handleTestKindChange = (kind: 'time' | 'count') => {
    if (kind === 'time') {
      setTestConfig({ kind: 'time', seconds: 30 });
    } else {
      setTestConfig({ kind: 'count', prompts: 25 });
    }
    onSettingChange();
  };

  const handleTimeSecondsChange = (seconds: 15 | 30 | 60 | 120) => {
    setTestConfig({ kind: 'time', seconds });
    onSettingChange();
  };

  const handleCountPromptsChange = (prompts: 10 | 25 | 50 | 100) => {
    setTestConfig({ kind: 'count', prompts });
    onSettingChange();
  };

  return (
    <div className="w-full flex flex-wrap items-center justify-between gap-3 py-3 px-4 rounded-lg bg-surface border border-border select-none text-xs">
      {/* Script & Content switches */}
      <div className="flex flex-wrap items-center gap-3">
        <Segmented<ScriptMode>
          options={[
            { value: 'hiragana', label: t('config.script.hiragana') },
            { value: 'katakana', label: t('config.script.katakana') },
            { value: 'both', label: t('config.script.both') },
          ]}
          value={currentScript}
          onChange={handleScriptChange}
          ariaLabel="Script selection"
        />

        <Segmented<ContentKind>
          options={[
            { value: 'single', label: t('config.content.single') },
            { value: 'words', label: t('config.content.words') },
            { value: 'phrases', label: t('config.content.phrases') },
          ]}
          value={currentContent}
          onChange={handleContentChange}
          ariaLabel="Content kind"
        />

        <Segmented<Strictness>
          options={[
            { value: 'learner', label: t('config.strictness.learner') },
            { value: 'ime', label: t('config.strictness.ime') },
          ]}
          value={currentStrictness}
          onChange={handleStrictnessChange}
          ariaLabel="Romaji strictness"
        />
      </div>

      {/* Test length & weak-focus toggle */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Segmented<'time' | 'count'>
            options={[
              { value: 'time', label: t('config.test.time') },
              { value: 'count', label: t('config.test.count') },
            ]}
            value={currentTestConfig.kind}
            onChange={handleTestKindChange}
            ariaLabel="Test type"
          />

          {currentTestConfig.kind === 'time' ? (
            <Segmented<15 | 30 | 60 | 120>
              options={[
                { value: 15, label: '15s' },
                { value: 30, label: '30s' },
                { value: 60, label: '60s' },
                { value: 120, label: '120s' },
              ]}
              value={currentTestConfig.seconds}
              onChange={handleTimeSecondsChange}
              ariaLabel="Time seconds"
            />
          ) : (
            <Segmented<10 | 25 | 50 | 100>
              options={[
                { value: 10, label: '10' },
                { value: 25, label: '25' },
                { value: 50, label: '50' },
                { value: 100, label: '100' },
              ]}
              value={currentTestConfig.prompts}
              onChange={handleCountPromptsChange}
              ariaLabel="Count prompts"
            />
          )}
        </div>

        <Toggle
          checked={currentWeakFocus}
          onChange={handleWeakFocusChange}
          label={t('config.weakFocus')}
        />
      </div>
    </div>
  );
}
