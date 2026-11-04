// Where the caret and the romaji buffer go in the text stream. Pure arithmetic on boxes that were
// measured once, so a keystroke reads no layout (docs/spec/frontend.md, "Hot path").

/** A token's box in the scrolled block, in pixels. */
export type TokenBox = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
};

export type StreamMetrics = {
  readonly lineHeight: number;
  readonly caretHeight: number;
  readonly viewWidth: number;
  // Advance of one character of the buffer's monospace font.
  readonly bufferCharWidth: number;
  // How far the buffer overlaps the bottom of its line, and so how much room the view keeps below.
  readonly bufferLift: number;
  // Lines the view shows.
  readonly lines: number;
};

export type Placement = {
  // Lines scrolled off the top.
  readonly shift: number;
  readonly caret: { readonly x: number; readonly y: number };
  readonly buffer: { readonly x: number; readonly y: number };
};

export function lineOf(box: TokenBox | undefined, lineHeight: number): number {
  return box === undefined || lineHeight <= 0 ? 0 : Math.round(box.y / lineHeight);
}

/** Height of the view: its lines and the room the buffer takes below the last one. */
export function viewHeight(metrics: StreamMetrics): number {
  return metrics.lines * metrics.lineHeight + metrics.bufferLift;
}

/**
 * Places the caret before token `caretIndex` (an index into `boxes`; one past the end puts it after
 * the last token). The line with the caret is kept second from the bottom, so the line just typed
 * stays visible above it and the next one below; the scroll is instant. `shift` is the scroll so
 * far, and the new one is returned.
 */
export function placeCaret(
  boxes: readonly TokenBox[],
  caretIndex: number,
  shift: number,
  bufferLength: number,
  metrics: StreamMetrics,
): Placement {
  const last = boxes.length - 1;
  if (last < 0) {
    return {
      shift: 0,
      caret: { x: 0, y: 0 },
      buffer: { x: 0, y: metrics.lineHeight - metrics.bufferLift },
    };
  }

  const index = Math.min(Math.max(caretIndex, 0), boxes.length);
  const box = boxes[Math.min(index, last)];
  if (box === undefined) {
    return { shift, caret: { x: 0, y: 0 }, buffer: { x: 0, y: 0 } };
  }
  const x = index <= last ? box.x : box.x + box.width;

  const line = lineOf(box, metrics.lineHeight);
  const below = Math.max(0, metrics.lines - 2);
  let nextShift = shift;
  if (line > nextShift + below) nextShift = line - below;
  if (line < nextShift) nextShift = line;

  const bufferWidth = bufferLength * metrics.bufferCharWidth;
  return {
    shift: nextShift,
    caret: { x: x - 1, y: box.y + (metrics.lineHeight - metrics.caretHeight) / 2 },
    buffer: {
      x: Math.max(0, Math.min(x, metrics.viewWidth - bufferWidth)),
      y: box.y + metrics.lineHeight - metrics.bufferLift,
    },
  };
}
