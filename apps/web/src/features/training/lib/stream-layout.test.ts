import { describe, it, expect } from 'vitest';
import { lineOf, placeCaret, trimIndex, viewHeight } from './stream-layout';
import type { StreamMetrics, TokenBox } from './stream-layout';

const metrics: StreamMetrics = {
  lineHeight: 72,
  caretHeight: 53,
  viewWidth: 400,
  bufferCharWidth: 10,
  bufferLift: 12,
  lines: 3,
};

// Five tokens of 48 px per line, five lines: tokens 0-4 on line 0, 5-9 on line 1, and so on.
const boxes: TokenBox[] = Array.from({ length: 25 }, (_, i) => ({
  x: (i % 5) * 48,
  y: Math.floor(i / 5) * 72,
  width: 48,
}));

describe('stream layout: the caret and the buffer', () => {
  it('puts the caret before its token, centred on the line', () => {
    const placement = placeCaret(boxes, 2, 0, 0, metrics);
    expect(placement.caret).toEqual({ x: 2 * 48 - 1, y: (72 - 53) / 2 });
  });

  it('puts the caret after the last token when it is one past the end', () => {
    const placement = placeCaret(boxes, 25, 0, 0, metrics);
    expect(placement.caret.x).toBe(4 * 48 + 48 - 1);
    expect(placement.caret.y).toBe(4 * 72 + (72 - 53) / 2);
  });

  it('clamps a caret outside the tokens', () => {
    expect(placeCaret(boxes, -5, 0, 0, metrics).caret.x).toBe(-1);
    expect(placeCaret(boxes, 99, 0, 0, metrics).caret.x).toBe(4 * 48 + 48 - 1);
  });

  it('keeps the current line second from the bottom of three, scrolling instantly', () => {
    expect(placeCaret(boxes, 3, 0, 0, metrics).shift).toBe(0); // line 0
    expect(placeCaret(boxes, 7, 0, 0, metrics).shift).toBe(0); // line 1: second from the bottom
    expect(placeCaret(boxes, 12, 0, 0, metrics).shift).toBe(1); // line 2 -> scrolled by one
    expect(placeCaret(boxes, 22, 1, 0, metrics).shift).toBe(3); // line 4
  });

  it('scrolls back when the caret returns to an earlier line', () => {
    expect(placeCaret(boxes, 2, 3, 0, metrics).shift).toBe(0);
    expect(placeCaret(boxes, 12, 3, 0, metrics).shift).toBe(2);
  });

  it('shows the current line first when the view has two lines', () => {
    const two = { ...metrics, lines: 2 };
    expect(placeCaret(boxes, 7, 0, 0, two).shift).toBe(1); // line 1 is the top line
    expect(placeCaret(boxes, 2, 1, 0, two).shift).toBe(0);
  });

  it('scrolls to the current line when the view has one line', () => {
    const one = { ...metrics, lines: 1 };
    expect(placeCaret(boxes, 12, 0, 0, one).shift).toBe(2);
  });

  it('puts the buffer under the caret, overlapping the bottom of the line', () => {
    const placement = placeCaret(boxes, 2, 0, 3, metrics);
    expect(placement.buffer).toEqual({ x: 2 * 48, y: 72 - 12 });
  });

  it('pulls the buffer back so it stays inside the view', () => {
    // Caret before the fifth token (x = 192); a buffer of 4 characters is 40 px wide: it fits.
    expect(placeCaret(boxes, 4, 0, 4, metrics).buffer.x).toBe(192);
    // A narrow view: the buffer must end at the right edge.
    const narrow = { ...metrics, viewWidth: 200 };
    expect(placeCaret(boxes, 4, 0, 4, narrow).buffer.x).toBe(160);
    // Wider than the view: it starts at 0.
    expect(placeCaret(boxes, 4, 0, 30, narrow).buffer.x).toBe(0);
  });

  it('copes with a stream that has no tokens yet', () => {
    const placement = placeCaret([], 0, 4, 0, metrics);
    expect(placement.shift).toBe(0);
    expect(placement.caret).toEqual({ x: 0, y: 0 });
  });

  it('numbers lines by the height of a line and sizes the view for the lines and the buffer', () => {
    expect(lineOf(boxes[7], 72)).toBe(1);
    expect(lineOf(undefined, 72)).toBe(0);
    expect(lineOf(boxes[7], 0)).toBe(0);
    expect(viewHeight(metrics)).toBe(3 * 72 + 12);
  });
});

describe('stream layout: where whole lines can be cut', () => {
  // Four tokens a line, lines of 72 px.
  const boxes: TokenBox[] = Array.from({ length: 16 }, (_, i) => ({
    x: (i % 4) * 40,
    y: Math.floor(i / 4) * 72,
    width: 40,
  }));

  it('starts at the line above the caret', () => {
    expect(trimIndex(boxes, 3, 72)).toBe(8);
    expect(trimIndex(boxes, 2, 72)).toBe(4);
  });

  it('keeps everything while the caret is on the first two lines', () => {
    expect(trimIndex(boxes, 0, 72)).toBe(0);
    expect(trimIndex(boxes, 1, 72)).toBe(0);
  });

  it('has nothing to cut without tokens or lines of no height', () => {
    expect(trimIndex([], 5, 72)).toBe(0);
    expect(trimIndex(boxes, 3, 0)).toBe(0);
  });
});
