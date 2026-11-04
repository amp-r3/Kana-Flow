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

export function ConfigBar(): JSX.Element {
  const currentScript = scriptSetting.value;
  const currentContent = contentSetting.value;
  const currentStrictness = strictnessSetting.value;
  const currentWeakFocus = weakFocusSetting.value;
  const currentTestConfig = testConfig.value;

  const handleScriptChange = (val: ScriptMode) => {
    setScript(val);
  };

  const handleContentChange = (val: ContentKind) => {
    setContent(val);
  };

  const handleStrictnessChange = (val: Strictness) => {
    setStrictness(val);
  };

  const handleWeakFocusChange = (val: boolean) => {
    setWeakFocus(val);
  };

  const handleTestKindChange = (kind: 'time' | 'count') => {
    if (kind === 'time') {
      setTestConfig({ kind: 'time', seconds: 30 });
    } else {
      setTestConfig({ kind: 'count', prompts: 25 });
    }
  };

  const handleTimeSecondsChange = (seconds: 15 | 30 | 60 | 120) => {
    setTestConfig({ kind: 'time', seconds });
  };

  const handleCountPromptsChange = (prompts: 10 | 25 | 50 | 100) => {
    setTestConfig({ kind: 'count', prompts });
  };

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3 py-3 select-none">
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
          ariaLabel={t('config.script.label')}
        />

        <Segmented<ContentKind>
          options={[
            { value: 'single', label: t('config.content.single') },
            { value: 'words', label: t('config.content.words') },
            { value: 'phrases', label: t('config.content.phrases') },
          ]}
          value={currentContent}
          onChange={handleContentChange}
          ariaLabel={t('config.content.label')}
        />

        <Segmented<Strictness>
          options={[
            { value: 'learner', label: t('config.strictness.learner') },
            { value: 'ime', label: t('config.strictness.ime') },
          ]}
          value={currentStrictness}
          onChange={handleStrictnessChange}
          ariaLabel={t('config.strictness.label')}
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
            ariaLabel={t('config.test.label')}
          />

          {currentTestConfig.kind === 'time' ? (
            <Segmented<15 | 30 | 60 | 120>
              options={[
                { value: 15, label: t('config.seconds.option', { n: 15 }) },
                { value: 30, label: t('config.seconds.option', { n: 30 }) },
                { value: 60, label: t('config.seconds.option', { n: 60 }) },
                { value: 120, label: t('config.seconds.option', { n: 120 }) },
              ]}
              value={currentTestConfig.seconds}
              onChange={handleTimeSecondsChange}
              ariaLabel={t('config.seconds.label')}
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
              ariaLabel={t('config.prompts.label')}
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
