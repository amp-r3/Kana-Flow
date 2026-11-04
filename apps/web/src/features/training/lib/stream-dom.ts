import { placeCaret, viewHeight } from './stream-layout';
import type { StreamMetrics, TokenBox } from './stream-layout';

// Writes the text stream to the DOM without a component render (docs/spec/frontend.md, "Hot path").
// A view renders the tokens once per completed prompt and hands the elements here; every keystroke
// then costs a few class and transform writes, and no layout read, because the positions are
// measured only when the layout can have changed: after a render, on a resize and when the fonts
// are in.
//
// The elements, as the view renders them:
//   root    gets `is-blurred` while the window has lost focus
//   view    clips the text; its height is set here
//   inner   holds the tokens, the caret and the buffer, and is scrolled by `translateY`
//   tokens  `[data-token="<number from the start of the test>"]` inside inner, in order, with
//           `data-skip` on those that need no input
//   caret   absolute; its child `flash` is shown for a rejected key
//   buffer  absolute; holds the Latin typed beyond the caret
// A token has one of the classes: `nk-char is-untyped | is-correct | is-miss`, or for a token that
// needs no input `nk-char is-skip is-untyped | is-skip is-done`.

export type StreamElements = {
  readonly root: HTMLElement;
  readonly view: HTMLElement;
  readonly inner: HTMLElement;
  readonly caret: HTMLElement;
  readonly flash: HTMLElement;
  readonly buffer: HTMLElement;
};

export type Measurement = {
  readonly boxes: readonly TokenBox[];
  readonly metrics: StreamMetrics;
};

export type StreamWriterOptions = {
  // Lines the view shows: 3, or 2 on a narrow screen.
  readonly lines: number;
  // Reads the layout. Replaced in tests, which have none.
  readonly measure?: (
    elements: StreamElements,
    tokens: readonly HTMLElement[],
    lines: number,
  ) => Measurement;
  // Whether the user prefers reduced motion; read when a key is rejected. Defaults to the
  // browser's setting.
  readonly reducedMotion?: () => boolean;
};

/** What a stream is painted from: the model's state when it was rendered. */
export type StreamPaint = {
  // Number of the token the caret stands before.
  readonly caret: number;
  // Numbers of the tokens that have an error.
  readonly errored: ReadonlySet<number>;
};

export type StreamWriter = {
  /** The tokens were rendered again: read them, paint them from the model, measure. */
  readonly sync: (paint: StreamPaint) => void;
  /** The caret moved: tokens in between become typed, or untyped again when it moved back. */
  readonly setCaret: (caret: number) => void;
  /** A token got an error. It stays marked, typed or not. */
  readonly markMiss: (token: number) => void;
  readonly setBuffer: (text: string) => void;
  /** A key was rejected: flashes the caret. */
  readonly reject: () => void;
  /** The caret blinks while nothing is typed. */
  readonly setIdle: (on: boolean) => void;
  /** The layout may have changed: measure again. */
  readonly measure: () => void;
  readonly destroy: () => void;
};

const DEFAULT_REJECT_MS = 120;

function classOf(skip: boolean, typed: boolean, missed: boolean): string {
  if (skip) return typed ? 'nk-char is-skip is-done' : 'nk-char is-skip is-untyped';
  if (missed) return 'nk-char is-miss';
  return typed ? 'nk-char is-correct' : 'nk-char is-untyped';
}

function cssMilliseconds(element: Element, name: string, fallback: number): number {
  const raw = getComputedStyle(element).getPropertyValue(name).trim();
  const value = Number.parseFloat(raw);
  if (Number.isNaN(value)) return fallback;
  return raw.endsWith('ms') ? value : raw.endsWith('s') ? value * 1000 : fallback;
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** The one place that reads the layout. */
function readLayout(
  elements: StreamElements,
  tokens: readonly HTMLElement[],
  lines: number,
): Measurement {
  const innerFont = Number.parseFloat(getComputedStyle(elements.inner).fontSize);
  const bufferStyle = getComputedStyle(elements.buffer);
  const bufferFont = Number.parseFloat(bufferStyle.fontSize);
  const bufferLine = Number.parseFloat(bufferStyle.lineHeight);
  return {
    boxes: tokens.map((token) => ({
      x: token.offsetLeft,
      y: token.offsetTop,
      width: token.offsetWidth,
    })),
    metrics: {
      lineHeight: tokens[0]?.offsetHeight ?? 0,
      caretHeight: Math.round(innerFont * 1.1),
      viewWidth: elements.view.clientWidth,
      // The advance of the monospace font is 0.6 em.
      bufferCharWidth: bufferFont * 0.6,
      bufferLift: Math.round((Number.isNaN(bufferLine) ? bufferFont * 1.5 : bufferLine) / 2),
      lines,
    },
  };
}

export function createStreamWriter(
  elements: StreamElements,
  options: StreamWriterOptions,
): StreamWriter {
  const { root, view, inner, caret: caretElement, flash, buffer } = elements;
  const measureLayout = options.measure ?? readLayout;
  const reducedMotion = options.reducedMotion ?? prefersReducedMotion;

  let tokens: readonly HTMLElement[] = [];
  let skip: readonly boolean[] = [];
  // Number of the first rendered token; token `n` is `tokens[n - first]`.
  let first = 0;
  let caret = 0;
  let missed = new Set<number>();
  // The class last written to each token, so an unchanged token is not written.
  let applied: string[] = [];
  let boxes: readonly TokenBox[] = [];
  let metrics: StreamMetrics | null = null;
  let shift = 0;
  let appliedShift = Number.NaN;
  let destroyed = false;

  const rejectMs = cssMilliseconds(root, '--dur-reject', DEFAULT_REJECT_MS);

  const paint = (token: number): void => {
    const index = token - first;
    const element = tokens[index];
    if (element === undefined) return;
    const next = classOf(skip[index] ?? false, token < caret, missed.has(token));
    if (applied[index] !== next) {
      applied[index] = next;
      element.className = next;
    }
  };

  const paintAll = (): void => {
    for (let i = 0; i < tokens.length; i++) paint(first + i);
  };

  const place = (): void => {
    if (metrics === null) return;
    const placement = placeCaret(boxes, caret - first, shift, buffer.textContent.length, metrics);
    shift = placement.shift;
    if (shift !== appliedShift) {
      appliedShift = shift;
      inner.style.transform = `translateY(${-shift * metrics.lineHeight}px)`;
    }
    caretElement.style.transform = `translate3d(${placement.caret.x}px,${placement.caret.y}px,0)`;
    buffer.style.transform = `translate3d(${placement.buffer.x}px,${placement.buffer.y}px,0)`;
  };

  const measure = (): void => {
    if (destroyed) return;
    const result = measureLayout(elements, tokens, options.lines);
    boxes = result.boxes;
    metrics = result.metrics;
    view.style.height = `${viewHeight(metrics)}px`;
    caretElement.style.height = `${metrics.caretHeight}px`;
    place();
  };

  const setWindowFocus = (on: boolean): void => {
    root.classList.toggle('is-blurred', !on);
  };
  const onBlur = (): void => {
    setWindowFocus(false);
  };
  const onFocus = (): void => {
    setWindowFocus(true);
  };
  // The text blurs only when the window loses focus: focus on Restart or a link does not.
  window.addEventListener('blur', onBlur);
  window.addEventListener('focus', onFocus);

  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
  observer?.observe(view);
  if ('fonts' in document) {
    void document.fonts.ready.then(measure);
  }

  return {
    sync(state) {
      tokens = Array.from(inner.querySelectorAll<HTMLElement>('[data-token]'));
      first = Number.parseInt(tokens[0]?.dataset['token'] ?? '0', 10);
      skip = tokens.map((token) => token.hasAttribute('data-skip'));
      missed = new Set(state.errored);
      caret = state.caret;
      applied = [];
      // The tokens at the top may have left, which moves the rest up: scroll from the start again.
      shift = 0;
      appliedShift = Number.NaN;
      paintAll();
      measure();
    },

    setCaret(next) {
      const previous = caret;
      caret = next;
      const from = Math.max(Math.min(previous, next), first);
      const to = Math.min(Math.max(previous, next), first + tokens.length);
      for (let token = from; token < to; token++) paint(token);
      place();
    },

    markMiss(token) {
      missed.add(token);
      paint(token);
    },

    setBuffer(text) {
      if (buffer.textContent === text) return;
      buffer.textContent = text;
      place();
    },

    reject() {
      try {
        for (const animation of flash.getAnimations()) animation.cancel();
        const animation = flash.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: rejectMs,
          // With reduced motion the colour holds for the whole time without fading.
          easing: reducedMotion()
            ? 'step-end'
            : getComputedStyle(root).getPropertyValue('--ease-in').trim() || 'ease-in',
        });
        // A cancelled animation rejects `finished`. A browser marks that promise as handled; a DOM
        // emulation may not, and the next rejected key cancels this flash.
        void animation.finished.catch(() => undefined);
      } catch {
        // No Web Animations in this environment: the key is still rejected, only not flashed.
      }
    },

    setIdle(on) {
      caretElement.classList.toggle('is-idle', on);
    },

    measure,

    destroy() {
      destroyed = true;
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      observer?.disconnect();
    },
  };
}
