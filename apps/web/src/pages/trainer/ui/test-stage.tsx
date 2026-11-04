import type { JSX } from 'preact';
import { useRef, useLayoutEffect, useMemo } from 'preact/hooks';
import { useComputed } from '@preact/signals';
import { t, locale } from '@/shared/i18n';
import { Kbd, RefreshIcon, Button } from '@/shared/ui';
import type { Session } from '@/features/training';
import { createInputSource, TextStream, useTestChrome } from '@/features/training';
import { LiveLine } from './live-line';

export type TestStageProps = {
  readonly session: Session;
  readonly onRestart: () => void;
};

/**
 * The test screen: a hidden field that takes the keyboard, the live line, the stream, one line for
 * notices, the translation and the hints. Nothing here reads a signal that a keystroke changes
 * while rendering: the lines of text below are signals passed as text nodes, and the stream writes
 * itself (docs/spec/frontend.md, "Hot path"). So a keystroke renders no component, and a completed
 * prompt renders only the stream.
 */
export function TestStage({ session, onRestart }: TestStageProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const source = useMemo(
    () =>
      createInputSource({
        onIntent: (intent) => {
          session.handleIntent(intent);
        },
      }),
    [session],
  );

  // Focus the field and listen to the keyboard from the first frame, so a key pressed at once is
  // not lost.
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return undefined;
    input.focus();
    return source.bind(input);
  }, [source]);

  useTestChrome(session);

  // These lines take their place before they have text, so the stream does not move when they get
  // some.
  const notice = useComputed(() =>
    source.layoutNotice.value
      ? t('stage.switchLayout')
      : source.imeNotice.value
        ? t('stage.turnImeOff')
        : '',
  );
  const revealed = useComputed(() =>
    session.isAssisted.value ? t('stage.revealed', { answer: session.canonicalRomaji.value }) : '',
  );
  const translation = useComputed(() => {
    const meaning = session.currentPrompt.value?.meaning;
    if (meaning === undefined) return '';
    return locale.value === 'ru' ? meaning.ru : meaning.en;
  });

  // Written to the DOM, not kept in state: a focus change must not render the screen.
  const markFocus = (focused: boolean): void => {
    stageRef.current?.setAttribute('data-input-focused', String(focused));
  };

  return (
    <div
      ref={stageRef}
      data-input-focused="true"
      onClick={() => {
        inputRef.current?.focus();
      }}
      className="nk-stage max-w-layout-test mx-auto flex w-full cursor-text flex-col gap-4 py-8 outline-none select-none"
    >
      {/* The field that takes the keyboard; the stream is only a picture of what it receives. */}
      <input
        ref={inputRef}
        type="text"
        onFocus={() => {
          markFocus(true);
        }}
        onBlur={() => {
          markFocus(false);
        }}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellcheck={false}
        lang="en"
        aria-label={t('stage.inputLabel')}
        className="sr-only"
      />

      <LiveLine session={session} />

      <TextStream session={session} />

      <div className="flex min-h-7 w-full items-center justify-center gap-3 text-center">
        <span role="status" className="text-fur-dim text-ui-label">
          {notice}
        </span>
        <span className="text-eye text-mono-romaji font-mono">{revealed}</span>
      </div>

      <p data-testid="translation" className="text-fur-dim text-ui-body min-h-12 text-center">
        {translation}
      </p>

      <div className="text-fur-dim text-ui-caption flex w-full flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <Kbd>{t('key.esc')}</Kbd>
          <span>{t('stage.escHint')}</span>
        </div>

        <span
          aria-hidden="true"
          className="nk-focus-hint text-ui-caption pointer-events-none px-3 py-1"
        >
          {t('stage.clickToFocus')}
        </span>

        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onRestart();
          }}
          className="nk-on-focus flex items-center gap-1.5"
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
