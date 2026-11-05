import { useLayoutEffect, useMemo, useRef } from 'preact/hooks';
import type { RefObject } from 'preact';
import { useSignalEffect } from '@preact/signals';
import type { Session } from '../model/session';
import { createInputSource } from './input-source';
import type { InputSource } from './input-source';

export type TestInput = {
  readonly source: InputSource;
  /** The hidden field that takes the keyboard. */
  readonly inputRef: RefObject<HTMLInputElement | null>;
  /** The element that shows whether the field has the focus (`data-input-focused`). */
  readonly stageRef: RefObject<HTMLDivElement | null>;
  /** The Finish button of a zen test; enabled while the test runs. */
  readonly finishRef: RefObject<HTMLButtonElement | null>;
  readonly focusInput: () => void;
  readonly onInputFocus: () => void;
  readonly onInputBlur: () => void;
};

/**
 * Everything the test screen needs to take the keyboard: the input source bound to the hidden
 * field, the focus, and the Finish button. The DOM is written through refs, not state, so a key or
 * a focus change renders no component (docs/spec/frontend.md, "Hot path").
 */
export function useTestInput(session: Session): TestInput {
  const inputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const finishRef = useRef<HTMLButtonElement>(null);

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

  // The Finish button works while the test runs. It is enabled through the DOM, not through a prop:
  // the first key must not render the screen. A new button starts disabled, as a test that has not
  // started.
  useSignalEffect(() => {
    // The phase is read first, always: an effect that reads nothing is never run again, and the
    // button may not exist yet (it appears when the test is switched to zen).
    const running = session.phase.value === 'running';
    if (finishRef.current) finishRef.current.disabled = !running;
  });

  const markFocus = (focused: boolean): void => {
    stageRef.current?.setAttribute('data-input-focused', String(focused));
  };

  return {
    source,
    inputRef,
    stageRef,
    finishRef,
    focusInput: () => {
      inputRef.current?.focus();
    },
    onInputFocus: () => {
      markFocus(true);
    },
    onInputBlur: () => {
      markFocus(false);
    },
  };
}
