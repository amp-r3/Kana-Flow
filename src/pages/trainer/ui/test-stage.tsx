import type { JSX } from 'preact';
import { useState, useRef, useEffect } from 'preact/hooks';
import { t, locale } from '@/shared/i18n';
import { Kbd, RefreshIcon, Button } from '@/shared/ui';
import { cx } from '@/shared/lib';
import type { TypingController } from '@/features/type-prompt';
import { handleKeyDown } from '@/features/type-prompt';
import { strictnessSetting } from '@/entities/kana';
import {
  phase,
  testConfig,
  promptResults,
  correctKeystrokes,
  mistakeCount,
  sessionStartedAt,
} from '@/entities/session';

export type TestStageProps = {
  readonly controller: TypingController;
  readonly onRestart: () => void;
};

export function TestStage({ controller, onRestart }: TestStageProps): JSX.Element {
  const [isFocused, setIsFocused] = useState(true);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const currentPrompt = controller.currentPrompt.value;
  const typed = controller.typedBuffer.value;
  const isShaking = controller.isShaking.value;
  const isAssisted = controller.isAssisted.value;
  const imeNotice = controller.imeNotice.value;
  const canonicalRomaji = controller.canonicalRomaji.value;

  const currentPhase = phase.value;
  const currentConfig = testConfig.value;
  const currentStrictness = strictnessSetting.value;
  const activeLocale = locale.value;

  // Live stats calculation from cheap counters
  const correct = correctKeystrokes.value;
  const mistakes = mistakeCount.value;
  const startedAt = sessionStartedAt.value;
  const now = controller.tickerNow.value || (startedAt ? startedAt : 0);

  const elapsedSec = startedAt > 0 && now > startedAt ? (now - startedAt) / 1000 : 0;
  const elapsedMin = elapsedSec / 60;
  const liveWpm = elapsedMin > 0 ? Math.round(correct / 5 / elapsedMin) : 0;
  const totalKeys = correct + mistakes;
  const liveAccuracy = totalKeys > 0 ? Math.round((correct / totalKeys) * 100) : 100;

  // Time / prompt counter
  let progressText = '';
  if (currentConfig.kind === 'time') {
    const remaining = Math.max(0, currentConfig.seconds - Math.floor(elapsedSec));
    progressText = `${remaining}s`;
  } else {
    const completed = promptResults.value.length;
    progressText = `${completed} / ${currentConfig.prompts}`;
  }

  // Auto-focus the input on mount and on arena click
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleArenaClick = () => {
    inputRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const intent = handleKeyDown(e);
    if (intent.kind !== 'ignore') {
      e.preventDefault();
      controller.handleIntent(intent, currentStrictness);
    }
  };

  return (
    <div
      onClick={handleArenaClick}
      className="relative w-full max-w-2xl mx-auto flex flex-col items-center gap-8 py-8 cursor-text select-none outline-none"
    >
      {/* Hidden input sink */}
      <input
        ref={inputRef}
        type="text"
        value=""
        onKeyDown={onKeyDown}
        onCompositionStart={() => {
          controller.handleCompositionStart();
        }}
        onCompositionEnd={() => {
          controller.handleCompositionEnd();
        }}
        onFocus={() => {
          setIsFocused(true);
        }}
        onBlur={() => {
          setIsFocused(false);
        }}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellcheck={false}
        lang="en"
        aria-label="Kana input sink"
        className="sr-only"
      />

      {/* Live stats strip */}
      <div className="w-full flex items-center justify-between text-xs text-text-dim px-2 border-b border-border/50 pb-2">
        <div className="flex items-center gap-4">
          <span className="font-mono text-accent text-sm font-normal">{progressText}</span>
          {currentPhase === 'running' && (
            <>
              <span className="font-mono font-normal">
                {liveWpm} <span className="text-[10px] text-text-dim uppercase">wpm</span>
              </span>
              <span className="font-mono font-normal">{liveAccuracy}%</span>
            </>
          )}
        </div>
        <div className="text-[11px] text-text-dim">
          {currentStrictness === 'ime' ? t('config.strictness.ime') : t('config.strictness.learner')}
        </div>
      </div>

      {/* Japanese IME warning notice */}
      {imeNotice && (
        <div className="w-full p-2.5 rounded bg-error/15 border border-error/30 text-error text-xs text-center">
          {t('stage.turnImeOff')}
        </div>
      )}

      {/* Main prompt arena */}
      <div
        className={cx(
          'w-full flex flex-col items-center justify-center gap-4 py-10 px-4 rounded-xl bg-surface border border-border min-h-[220px] transition-transform',
          isShaking && 'animate-shake',
        )}
      >
        {/* Large kana glyph display (Noto Sans JP Bold) */}
        <div className="font-kana font-bold text-5xl md:text-6xl text-text tracking-wide text-center">
          {currentPrompt ? currentPrompt.text : '...'}
        </div>

        {/* Translation / reading hint */}
        {currentPrompt?.meaning && (
          <div className="text-sm font-normal text-text-dim text-center">
            {activeLocale === 'ru' ? currentPrompt.meaning.ru : currentPrompt.meaning.en}
          </div>
        )}

        {/* Revealed canonical romaji */}
        {isAssisted && (
          <div className="text-sm font-mono font-normal text-accent bg-accent/10 px-3 py-1 rounded">
            {t('stage.revealed', { answer: canonicalRomaji })}
          </div>
        )}

        {/* Typed romaji mirror (JetBrains Mono Regular 400) */}
        <div className="font-mono font-normal text-xl text-accent tracking-widest min-h-[1.75rem] flex items-center justify-center">
          {typed}
          <span className="inline-block w-2 h-5 bg-accent ml-0.5 animate-pulse" />
        </div>
      </div>

      {/* Unfocused "Click to focus" indicator */}
      {!isFocused && (
        <div
          className="pointer-events-none -mt-4 text-xs text-text-dim bg-surface-2/90 border border-border px-3 py-1 rounded-full shadow-md"
          aria-hidden="true"
        >
          {t('stage.clickToFocus')}
        </div>
      )}

      {/* Bottom hints & restart button */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 text-xs text-text-dim pt-2">
        <div className="flex items-center gap-2">
          <Kbd>Esc</Kbd>
          <span>{t('stage.escHint')}</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onRestart();
          }}
          className="flex items-center gap-1.5"
          ariaLabel="Restart test"
        >
          <RefreshIcon size={13} />
          <span className="hidden sm:inline">{t('stage.tabHint')}</span>
          <span className="sm:hidden">Restart</span>
        </Button>
      </div>
    </div>
  );
}
