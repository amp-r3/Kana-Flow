import type { JSX } from 'preact';
import { useState, useRef, useEffect } from 'preact/hooks';
import { t, locale } from '@/shared/i18n';
import { Kbd, RefreshIcon, Button } from '@/shared/ui';
import { cx } from '@/shared/lib';
import type { Session } from '@/features/training';
import { bindKeyboard } from '@/features/training';
import { strictnessSetting } from '@/entities/settings';
import { LiveStatsStrip } from './live-stats-strip';

export type TestStageProps = {
  readonly session: Session;
  readonly onRestart: () => void;
};

export function TestStage({ session, onRestart }: TestStageProps): JSX.Element {
  const [isFocused, setIsFocused] = useState(true);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const currentPrompt = session.currentPrompt.value;
  const typed = session.typedBuffer.value;
  const isShaking = session.isShaking.value;
  const isAssisted = session.isAssisted.value;
  const imeNotice = session.imeNotice.value;
  const canonicalRomaji = session.canonicalRomaji.value;
  const currentStrictness = strictnessSetting.value;
  const activeLocale = locale.value;

  // Auto-focus the input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Global keyboard binding managing focus redirection and intent handling (Plan 6.2)
  useEffect(() => {
    return bindKeyboard({
      onIntent: (intent) => {
        session.handleIntent(intent);
      },
      getInputElement: () => inputRef.current,
    });
  }, [session]);

  const handleArenaClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div
      onClick={handleArenaClick}
      className="max-w-layout-test relative mx-auto flex w-full cursor-text flex-col items-center gap-8 py-8 outline-none select-none"
    >
      {/* Hidden input sink */}
      <input
        ref={inputRef}
        type="text"
        value=""
        onCompositionStart={() => {
          session.handleCompositionStart();
        }}
        onCompositionEnd={() => {
          session.handleCompositionEnd();
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
        aria-label={t('stage.inputLabel')}
        className="sr-only"
      />

      {/* Live stats strip */}
      <LiveStatsStrip session={session} strictness={currentStrictness} />

      {/* Japanese IME warning notice */}
      {imeNotice && (
        <div className="text-fur-dim text-ui-label w-full p-2.5 text-center">
          {t('stage.turnImeOff')}
        </div>
      )}

      {/* Main prompt arena */}
      <div
        data-testid="prompt-arena"
        data-canonical={canonicalRomaji}
        data-rejected={isShaking ? 'true' : undefined}
        className={cx(
          'flex min-h-56 w-full flex-col items-center justify-center gap-4 px-4 py-10 transition-transform',
          isShaking && 'animate-shake',
        )}
      >
        {/* Large kana glyph display (Noto Sans JP Bold) */}
        <div
          data-testid="prompt-text"
          className="font-jp text-fur text-jp-test-sm sm:text-jp-test text-center"
        >
          {currentPrompt ? currentPrompt.text : '...'}
        </div>

        {/* Translation / reading hint */}
        {currentPrompt?.meaning && (
          <div className="text-fur-dim text-ui-body text-center">
            {activeLocale === 'ru' ? currentPrompt.meaning.ru : currentPrompt.meaning.en}
          </div>
        )}

        {/* Revealed canonical romaji */}
        {isAssisted && (
          <div className="text-eye text-mono-romaji px-3 py-1 font-mono">
            {t('stage.revealed', { answer: canonicalRomaji })}
          </div>
        )}

        {/* Typed romaji mirror (JetBrains Mono Regular 400) */}
        <div className="text-eye text-mono-romaji flex min-h-7 items-center justify-center font-mono">
          {typed}
          <span className="bg-eye animate-blink ml-0.5 inline-block h-5 w-0.5" />
        </div>
      </div>

      {/* Unfocused "Click to focus" indicator (fixed height to prevent layout shift on blur) */}
      <div className="-mt-4 flex h-6 items-center justify-center">
        {!isFocused && (
          <div
            className="text-fur-dim text-ui-caption pointer-events-none px-3 py-1"
            aria-hidden="true"
          >
            {t('stage.clickToFocus')}
          </div>
        )}
      </div>

      {/* Bottom hints & restart button */}
      <div className="text-fur-dim text-ui-caption flex w-full flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <Kbd>{t('key.esc')}</Kbd>
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
          ariaLabel={t('stage.restartLabel')}
        >
          <RefreshIcon size={13} />
          <span className="hidden sm:inline">{t('stage.tabHint')}</span>
          <span className="sm:hidden">{t('stage.restart')}</span>
        </Button>
      </div>
    </div>
  );
}
