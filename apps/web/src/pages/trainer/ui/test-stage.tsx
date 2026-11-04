import type { JSX } from 'preact';
import { useState, useRef, useEffect } from 'preact/hooks';
import { t, locale } from '@/shared/i18n';
import { Kbd, RefreshIcon, Button } from '@/shared/ui';
import { cx } from '@/shared/lib';
import type { TypingController } from '@/features/type-prompt';
import { bindKeyboard } from '@/features/type-prompt';
import { strictnessSetting } from '@/entities/kana';
import { LiveStatsStrip } from './live-stats-strip';

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
        controller.handleIntent(intent);
      },
      getInputElement: () => inputRef.current,
    });
  }, [controller]);

  const handleArenaClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div
      onClick={handleArenaClick}
      className="relative mx-auto flex w-full max-w-2xl cursor-text flex-col items-center gap-8 py-8 outline-none select-none"
    >
      {/* Hidden input sink */}
      <input
        ref={inputRef}
        type="text"
        value=""
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
      <LiveStatsStrip controller={controller} strictness={currentStrictness} />

      {/* Japanese IME warning notice */}
      {imeNotice && (
        <div className="bg-error/15 border-error/30 text-error w-full rounded border p-2.5 text-center text-xs">
          {t('stage.turnImeOff')}
        </div>
      )}

      {/* Main prompt arena */}
      <div
        data-testid="prompt-arena"
        data-canonical={canonicalRomaji}
        data-rejected={isShaking ? 'true' : undefined}
        className={cx(
          'bg-surface border-border flex min-h-[220px] w-full flex-col items-center justify-center gap-4 rounded-xl border px-4 py-10 transition-transform',
          isShaking && 'animate-shake',
        )}
      >
        {/* Large kana glyph display (Noto Sans JP Bold) */}
        <div
          data-testid="prompt-text"
          className="font-kana text-text text-center text-5xl font-bold tracking-wide md:text-6xl"
        >
          {currentPrompt ? currentPrompt.text : '...'}
        </div>

        {/* Translation / reading hint */}
        {currentPrompt?.meaning && (
          <div className="text-text-dim text-center text-sm font-normal">
            {activeLocale === 'ru' ? currentPrompt.meaning.ru : currentPrompt.meaning.en}
          </div>
        )}

        {/* Revealed canonical romaji */}
        {isAssisted && (
          <div className="text-accent bg-accent/10 rounded px-3 py-1 font-mono text-sm font-normal">
            {t('stage.revealed', { answer: canonicalRomaji })}
          </div>
        )}

        {/* Typed romaji mirror (JetBrains Mono Regular 400) */}
        <div className="text-accent flex min-h-[1.75rem] items-center justify-center font-mono text-xl font-normal tracking-widest">
          {typed}
          <span className="bg-accent ml-0.5 inline-block h-5 w-2 animate-pulse" />
        </div>
      </div>

      {/* Unfocused "Click to focus" indicator (fixed height to prevent layout shift on blur) */}
      <div className="-mt-4 flex h-6 items-center justify-center">
        {!isFocused && (
          <div
            className="text-text-dim bg-surface-2/90 border-border pointer-events-none rounded-full border px-3 py-1 text-xs shadow-md"
            aria-hidden="true"
          >
            {t('stage.clickToFocus')}
          </div>
        )}
      </div>

      {/* Bottom hints & restart button */}
      <div className="text-text-dim flex w-full flex-wrap items-center justify-between gap-3 pt-2 text-xs">
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
