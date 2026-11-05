import type { RefObject } from 'preact';
import { useLayoutEffect, useRef } from 'preact/hooks';
import { useSignalEffect } from '@preact/signals';
import { createStreamWriter } from './stream-dom';
import type { StreamWriter } from './stream-dom';
import type { Session } from '../model/session';
import type { StreamSnapshot } from '../model/stream';

export type StreamRefs = {
  readonly root: RefObject<HTMLElement | null>;
  readonly view: RefObject<HTMLElement | null>;
  readonly inner: RefObject<HTMLElement | null>;
  readonly caret: RefObject<HTMLElement | null>;
  readonly flash: RefObject<HTMLElement | null>;
  readonly buffer: RefObject<HTMLElement | null>;
  // Holds the text of the prompt on display, for assistive technology and for tests.
  readonly promptText: RefObject<HTMLElement | null>;
};

/**
 * Binds a rendered stream to the session. The view renders when `drawn` changes, once per completed
 * prompt; everything a keystroke changes goes through the writer by signal effects, with no render
 * (docs/spec/frontend.md, "Hot path"). The root also carries what tests read: `data-phase`,
 * `data-rejected`, which is set by a rejected key and cleared by the next accepted one.
 */
export function useStreamBinding(
  session: Session,
  refs: StreamRefs,
  lines: number,
  drawn: StreamSnapshot,
): void {
  const writerRef = useRef<StreamWriter | null>(null);
  // The last mistake already shown, so one that is old when the view mounts is not flashed.
  const shownMistake = useRef(0);
  // Accepted keystrokes at the time of the last rejected key.
  const rejectedAfter = useRef(-1);

  useLayoutEffect(() => {
    const { root, view, inner, caret, flash, buffer } = refs;
    if (!root.current || !view.current || !inner.current) return undefined;
    if (!caret.current || !flash.current || !buffer.current) return undefined;
    const writer = createStreamWriter(
      {
        root: root.current,
        view: view.current,
        inner: inner.current,
        caret: caret.current,
        flash: flash.current,
        buffer: buffer.current,
      },
      { lines },
    );
    writerRef.current = writer;
    shownMistake.current = session.mistake.peek()?.seq ?? 0;
    return () => {
      writer.destroy();
      writerRef.current = null;
    };
  }, [session, refs, lines]);

  // The tokens in the DOM are new: paint them from the model and measure.
  useLayoutEffect(() => {
    if (refs.promptText.current) {
      refs.promptText.current.textContent = session.currentPrompt.peek()?.text ?? '';
    }
    writerRef.current?.sync({ caret: session.caret.peek(), errored: session.erroredTokens() });
  }, [session, refs, lines, drawn]);

  useSignalEffect(() => {
    writerRef.current?.setCaret(session.caret.value);
  });

  useSignalEffect(() => {
    writerRef.current?.setBuffer(session.romajiBuffer.value);
  });

  useSignalEffect(() => {
    const mistake = session.mistake.value;
    const writer = writerRef.current;
    if (mistake === null || writer === null || mistake.seq <= shownMistake.current) return;
    shownMistake.current = mistake.seq;
    writer.markMiss(mistake.token);
    if (mistake.kind === 'rejected') {
      writer.reject();
      rejectedAfter.current = session.correctKeystrokes.peek();
      refs.root.current?.setAttribute('data-rejected', 'true');
    }
  });

  useSignalEffect(() => {
    // Every accepted key changes this count and clears the mark of a rejected one.
    if (session.correctKeystrokes.value !== rejectedAfter.current) {
      refs.root.current?.removeAttribute('data-rejected');
    }
  });

  useSignalEffect(() => {
    const phase = session.phase.value;
    writerRef.current?.setIdle(phase !== 'running');
    refs.root.current?.setAttribute('data-phase', phase);
  });

  useSignalEffect(() => {
    const text = session.currentPrompt.value?.text ?? '';
    if (refs.promptText.current) refs.promptText.current.textContent = text;
  });
}
