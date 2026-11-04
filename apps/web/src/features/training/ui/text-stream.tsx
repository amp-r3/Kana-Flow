import type { JSX } from 'preact';
import { useMemo, useRef } from 'preact/hooks';
import { t } from '@/shared/i18n';
import { cx, useMediaQuery } from '@/shared/lib';
import { contentSetting } from '@/entities/settings';
import { useStreamBinding } from '../lib/use-stream-binding';
import type { Session } from '../model/session';

export type TextStreamProps = {
  readonly session: Session;
};

/**
 * The text stream: the prompts around the caret, the caret and the romaji buffer. It renders when
 * a prompt enters or leaves the window, once per completed prompt, and never on a keystroke:
 * `useStreamBinding` writes those to the DOM. The markup has no child component, so that one render
 * is one component render. The contract with the writer is in `lib/stream-dom.ts`.
 */
export function TextStream({ session }: TextStreamProps): JSX.Element {
  const drawn = session.stream.value;
  const solo = contentSetting.value === 'single';
  const narrow = useMediaQuery('(max-width: 639px)');

  const root = useRef<HTMLDivElement>(null);
  const view = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const caret = useRef<HTMLSpanElement>(null);
  const flash = useRef<HTMLSpanElement>(null);
  const buffer = useRef<HTMLSpanElement>(null);
  const promptText = useRef<HTMLSpanElement>(null);
  const refs = useMemo(() => ({ root, view, inner, caret, flash, buffer, promptText }), []);
  useStreamBinding(session, refs, narrow ? 2 : 3, drawn);

  return (
    <div ref={root} data-testid="prompt-arena" className="nk-test">
      {/* The prompt on display, for assistive technology and tests: the stream is a picture. */}
      <span ref={promptText} data-testid="prompt-text" className="sr-only" />
      <div ref={view} className="nk-test__text" lang="ja" aria-hidden="true">
        <div
          ref={inner}
          className={cx(
            'nk-test__inner font-jp',
            solo ? 'text-jp-solo-sm sm:text-jp-solo' : 'text-jp-test-sm sm:text-jp-test',
          )}
        >
          {drawn.prompts.map((prompt) => (
            <span key={prompt.index} className="nk-word">
              {prompt.tokens.map((token, i) => (
                <span
                  key={prompt.firstToken + i}
                  className="nk-char is-untyped"
                  data-token={prompt.firstToken + i}
                  data-skip={token.skip ? '' : undefined}
                >
                  {token.glyph}
                </span>
              ))}
              <wbr />
            </span>
          ))}
          <span ref={caret} className="nk-caret">
            <span ref={flash} className="nk-caret__reject" />
          </span>
          <span
            ref={buffer}
            className="nk-test__buffer text-mono-small sm:text-mono-romaji font-mono"
          />
        </div>
      </div>
      <div className="nk-test__blur text-ui-label" aria-hidden="true">
        {t('stage.blur')}
      </div>
    </div>
  );
}
