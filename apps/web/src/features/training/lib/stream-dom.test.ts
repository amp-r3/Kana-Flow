// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createStreamWriter } from './stream-dom';
import type { Measurement, StreamElements, StreamWriter } from './stream-dom';

type Spec = { readonly glyph: string; readonly skip?: boolean };

// Five tokens of 48 px per line; the view shows three lines of 72 px.
function measurementOf(count: number): Measurement {
  return {
    boxes: Array.from({ length: count }, (_, i) => ({
      x: (i % 5) * 48,
      y: Math.floor(i / 5) * 72,
      width: 48,
    })),
    metrics: {
      lineHeight: 72,
      caretHeight: 52,
      viewWidth: 240,
      bufferCharWidth: 10,
      bufferLift: 12,
      lines: 3,
    },
  };
}

function render(specs: readonly Spec[], first: number): StreamElements {
  const root = document.createElement('div');
  const view = document.createElement('div');
  const inner = document.createElement('div');
  const caret = document.createElement('span');
  const flash = document.createElement('span');
  const buffer = document.createElement('span');
  specs.forEach((spec, i) => {
    const token = document.createElement('span');
    token.dataset['token'] = String(first + i);
    if (spec.skip === true) token.setAttribute('data-skip', '');
    token.className = 'nk-char is-untyped';
    token.textContent = spec.glyph;
    inner.append(token);
  });
  caret.append(flash);
  inner.append(caret, buffer);
  view.append(inner);
  root.append(view);
  document.body.append(root);
  return { root, view, inner, caret, flash, buffer };
}

const tokenOf = (elements: StreamElements, number: number): HTMLElement => {
  const found = elements.inner.querySelector<HTMLElement>(`[data-token="${number}"]`);
  if (found === null) throw new Error(`no token ${number}`);
  return found;
};
const classes = (elements: StreamElements, numbers: readonly number[]): string[] =>
  numbers.map((n) => tokenOf(elements, n).className);

// 12 tokens: あ い う え お か き く [、] け こ さ, numbered from 100.
const SPECS: readonly Spec[] = [
  ...Array.from('あいうえおかきく', (glyph) => ({ glyph })),
  { glyph: '、', skip: true },
  ...Array.from('けこさ', (glyph) => ({ glyph })),
];
const FIRST = 100;

describe('stream writer: painting the tokens', () => {
  let elements: StreamElements;
  let writer: StreamWriter;
  let measure: ReturnType<typeof vi.fn<() => Measurement>>;

  beforeEach(() => {
    elements = render(SPECS, FIRST);
    measure = vi.fn(() => measurementOf(SPECS.length));
    writer = createStreamWriter(elements, { lines: 3, measure });
  });

  afterEach(() => {
    writer.destroy();
    elements.root.remove();
    vi.restoreAllMocks();
  });

  it('paints a stream from the model: typed, untyped, errors and skipped tokens', () => {
    writer.sync({ caret: 103, errored: new Set([101, 105]) });
    expect(classes(elements, [100, 101, 102, 103, 104, 105])).toEqual([
      'nk-char is-correct',
      'nk-char is-miss', // typed, with an error
      'nk-char is-correct',
      'nk-char is-untyped',
      'nk-char is-untyped',
      'nk-char is-miss', // not typed yet, already wrong
    ]);
  });

  it('a skipped token is dim once passed, and untyped before', () => {
    writer.sync({ caret: 105, errored: new Set() });
    expect(tokenOf(elements, 108).className).toBe('nk-char is-skip is-untyped');
    writer.setCaret(110);
    expect(tokenOf(elements, 108).className).toBe('nk-char is-skip is-done');
  });

  it('moving the caret forward types the tokens it passes', () => {
    writer.sync({ caret: 100, errored: new Set() });
    writer.setCaret(3 + FIRST);
    expect(classes(elements, [100, 101, 102, 103])).toEqual([
      'nk-char is-correct',
      'nk-char is-correct',
      'nk-char is-correct',
      'nk-char is-untyped',
    ]);
  });

  it('moving the caret back untypes them again (the live conversion may step back)', () => {
    writer.sync({ caret: 105, errored: new Set() });
    writer.setCaret(102);
    expect(classes(elements, [101, 102])).toEqual(['nk-char is-correct', 'nk-char is-untyped']);
  });

  it('an error stays on its token when the caret passes it', () => {
    writer.sync({ caret: 100, errored: new Set() });
    writer.markMiss(101);
    expect(tokenOf(elements, 101).className).toBe('nk-char is-miss');
    writer.setCaret(105);
    expect(tokenOf(elements, 101).className).toBe('nk-char is-miss');
  });

  it('ignores an error on a token that is not rendered, and never marks a skipped one', () => {
    writer.sync({ caret: 100, errored: new Set() });
    expect(() => {
      writer.markMiss(999);
    }).not.toThrow();
    writer.markMiss(108);
    expect(tokenOf(elements, 108).className).toBe('nk-char is-skip is-untyped');
  });

  it('writes only the tokens whose state changed', () => {
    writer.sync({ caret: 100, errored: new Set() });
    // A sentinel on a token the move does not reach: if it were rewritten, it would be lost.
    tokenOf(elements, 110).className = 'sentinel';
    writer.setCaret(102);
    expect(tokenOf(elements, 110).className).toBe('sentinel');
    expect(classes(elements, [100, 101, 102])).toEqual([
      'nk-char is-correct',
      'nk-char is-correct',
      'nk-char is-untyped',
    ]);
  });

  it('a caret outside the rendered tokens changes nothing and breaks nothing', () => {
    writer.sync({ caret: 100, errored: new Set() });
    writer.setCaret(500);
    expect(classes(elements, [100, 111])).toEqual(['nk-char is-correct', 'nk-char is-correct']);
    writer.setCaret(0);
    expect(classes(elements, [100, 111])).toEqual(['nk-char is-untyped', 'nk-char is-untyped']);
  });
});

describe('stream writer: the caret, the buffer and the scroll', () => {
  let elements: StreamElements;
  let writer: StreamWriter;

  beforeEach(() => {
    elements = render(SPECS, FIRST);
    writer = createStreamWriter(elements, { lines: 3, measure: () => measurementOf(SPECS.length) });
    writer.sync({ caret: 100, errored: new Set() });
  });

  afterEach(() => {
    writer.destroy();
    elements.root.remove();
  });

  it('sizes the view for its lines and the buffer, and the caret for the text', () => {
    expect(elements.view.style.height).toBe(`${3 * 72 + 12}px`);
    expect(elements.caret.style.height).toBe('52px');
  });

  it('puts the caret before its token', () => {
    writer.setCaret(102);
    // x = 2 * 48 - 1, y = (72 - 52) / 2
    expect(elements.caret.style.transform).toBe('translate3d(95px,10px,0)');
  });

  it('follows the caret onto the next line, and scrolls once it is past the second', () => {
    writer.setCaret(107);
    expect(elements.caret.style.transform).toBe('translate3d(95px,82px,0)');
    expect(elements.inner.style.transform).toBe('translateY(0px)');
    writer.setCaret(111);
    // Token 11 is on line 2: the view scrolls by one line.
    expect(elements.inner.style.transform).toBe('translateY(-72px)');
  });

  it('puts the buffer under the caret and keeps it inside the view', () => {
    writer.setCaret(102);
    writer.setBuffer('k');
    expect(elements.buffer.textContent).toBe('k');
    expect(elements.buffer.style.transform).toBe('translate3d(96px,60px,0)');

    writer.setCaret(104);
    writer.setBuffer('shi');
    // 4 * 48 = 192, but three characters of 10 px must end at the view's 240 px.
    expect(elements.buffer.style.transform).toBe('translate3d(192px,60px,0)');
    writer.setBuffer('shichi');
    expect(elements.buffer.style.transform).toBe('translate3d(180px,60px,0)');
  });

  it('clears the buffer', () => {
    writer.setBuffer('ka');
    writer.setBuffer('');
    expect(elements.buffer.textContent).toBe('');
  });

  it('scrolls from the start again when the tokens at the top have gone', () => {
    writer.setCaret(111);
    expect(elements.inner.style.transform).toBe('translateY(-72px)');

    // The first prompt left the window: five tokens go and the rest move up a line.
    for (let n = 100; n < 105; n++) tokenOf(elements, n).remove();
    const rest = SPECS.length - 5;
    const shifted = createStreamWriter(elements, {
      lines: 3,
      measure: () => measurementOf(rest),
    });
    shifted.sync({ caret: 111, errored: new Set() });
    // Token 111 is now index 6, on line 1: the second line, no scroll needed.
    expect(elements.inner.style.transform).toBe('translateY(0px)');
    expect(tokenOf(elements, 105).className).toBe('nk-char is-correct');
    shifted.destroy();
  });

  it('measures again on request, for a resize or a font that arrived', () => {
    let boxesWide = measurementOf(SPECS.length);
    const local = render(SPECS, FIRST);
    const resized = createStreamWriter(local, { lines: 3, measure: () => boxesWide });
    resized.sync({ caret: 102, errored: new Set() });
    expect(local.caret.style.transform).toBe('translate3d(95px,10px,0)');

    boxesWide = {
      ...boxesWide,
      boxes: boxesWide.boxes.map((box) => ({ ...box, x: box.x * 2, width: box.width * 2 })),
    };
    resized.measure();
    expect(local.caret.style.transform).toBe('translate3d(191px,10px,0)');
    resized.destroy();
    local.root.remove();
  });
});

describe('stream writer: the hot path reads no layout', () => {
  it('measures on sync and on request only, not on a keystroke', () => {
    const elements = render(SPECS, FIRST);
    const measure = vi.fn(() => measurementOf(SPECS.length));
    const writer = createStreamWriter(elements, { lines: 3, measure });
    writer.sync({ caret: 100, errored: new Set() });
    expect(measure).toHaveBeenCalledTimes(1);

    for (let caret = 101; caret <= 111; caret++) {
      writer.setCaret(caret);
      writer.setBuffer(caret % 2 === 0 ? 'k' : '');
      writer.markMiss(caret);
      writer.reject();
    }
    expect(measure).toHaveBeenCalledTimes(1);

    writer.measure();
    expect(measure).toHaveBeenCalledTimes(2);
    writer.destroy();
    elements.root.remove();
  });
});

describe('stream writer: the rejected key, the blink and the window focus', () => {
  let elements: StreamElements;
  let writer: StreamWriter;

  beforeEach(() => {
    elements = render(SPECS, FIRST);
    writer = createStreamWriter(elements, { lines: 3, measure: () => measurementOf(SPECS.length) });
    writer.sync({ caret: 100, errored: new Set() });
  });

  afterEach(() => {
    writer.destroy();
    elements.root.remove();
    vi.restoreAllMocks();
  });

  // What a browser returns from animate(); the writer cancels the flash before starting another.
  function stubAnimation(): {
    animate: ReturnType<typeof vi.fn<HTMLElement['animate']>>;
    getAnimations: ReturnType<typeof vi.fn<HTMLElement['getAnimations']>>;
  } {
    const animate = vi.fn<HTMLElement['animate']>(() => new Animation());
    const getAnimations = vi.fn<HTMLElement['getAnimations']>(() => []);
    elements.flash.animate = animate;
    elements.flash.getAnimations = getAnimations;
    return { animate, getAnimations };
  }

  it('flashes the caret through opacity for 120 ms, cancelling the flash before', () => {
    const { animate, getAnimations } = stubAnimation();
    writer.reject();
    expect(getAnimations).toHaveBeenCalledTimes(1);
    expect(getAnimations.mock.invocationCallOrder[0]).toBeLessThan(
      animate.mock.invocationCallOrder[0] ?? 0,
    );
    expect(animate).toHaveBeenCalledWith([{ opacity: 1 }, { opacity: 0 }], {
      duration: 120,
      easing: 'ease-in',
    });
  });

  it('holds the colour without a fade when the user prefers reduced motion', () => {
    const local = render(SPECS, FIRST);
    const reduced = createStreamWriter(local, {
      lines: 3,
      measure: () => measurementOf(SPECS.length),
      reducedMotion: () => true,
    });
    const animate = vi.fn<HTMLElement['animate']>(() => new Animation());
    local.flash.animate = animate;
    local.flash.getAnimations = () => [];
    reduced.reject();
    expect(animate).toHaveBeenCalledWith(expect.anything(), {
      duration: 120,
      easing: 'step-end',
    });
    reduced.destroy();
    local.root.remove();
  });

  it('does not throw where there are no Web Animations', () => {
    expect(() => {
      writer.reject();
    }).not.toThrow();
  });

  it('blinks the caret while idle', () => {
    writer.setIdle(true);
    expect(elements.caret.classList.contains('is-idle')).toBe(true);
    writer.setIdle(false);
    expect(elements.caret.classList.contains('is-idle')).toBe(false);
  });

  it('blurs the text only while the window has lost focus', () => {
    window.dispatchEvent(new Event('blur'));
    expect(elements.root.classList.contains('is-blurred')).toBe(true);
    window.dispatchEvent(new Event('focus'));
    expect(elements.root.classList.contains('is-blurred')).toBe(false);
  });

  it('stops listening to the window when destroyed', () => {
    writer.destroy();
    window.dispatchEvent(new Event('blur'));
    expect(elements.root.classList.contains('is-blurred')).toBe(false);
  });

  it('a destroyed writer does not measure again', () => {
    const measure = vi.fn(() => measurementOf(SPECS.length));
    const local = render(SPECS, FIRST);
    const other = createStreamWriter(local, { lines: 3, measure });
    other.destroy();
    other.measure();
    expect(measure).not.toHaveBeenCalled();
    local.root.remove();
  });
});
