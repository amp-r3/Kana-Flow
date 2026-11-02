import type { PathNode, StreamMatcher, StreamPosition, StreamState } from './types';

// Index of the first token at or after `from` that needs input (skip tokens are passed over).
export function nextReal(m: StreamMatcher, from: number): number {
  let j = from;
  for (;;) {
    const t = m.tokens[j];
    if (t === undefined || t.kind !== 'skip') return j;
    j += 1;
  }
}

export function textOf(m: StreamMatcher, pos: StreamPosition): string | null {
  if (pos.token < 0) return null;
  return m.tokens[pos.token]?.spellings[pos.spelling]?.text ?? null;
}

export function isInProgress(m: StreamMatcher, pos: StreamPosition): boolean {
  const text = textOf(m, pos);
  return text !== null && pos.offset < text.length;
}

export function start(): StreamState {
  return {
    positions: [{ token: -1, spelling: 0, offset: 0, firstKey: 0, lastKey: -1, path: null }],
    keys: 0,
  };
}

// When two paths reach the same position the one that arrived first, in table order, is kept.
export function step(m: StreamMatcher, s: StreamState, key: string): StreamState | null {
  const ch = key.toLowerCase();
  const index = s.keys;
  const next: StreamPosition[] = [];
  const seen = new Set<number>();
  const push = (
    token: number,
    spelling: number,
    offset: number,
    firstKey: number,
    done: boolean,
    path: PathNode | null,
  ): void => {
    const id = ((token + 1) * 256 + spelling) * 16 + offset;
    if (seen.has(id)) return;
    seen.add(id);
    next.push({ token, spelling, offset, firstKey, lastKey: done ? index : -1, path });
  };

  for (const pos of s.positions) {
    const text = textOf(m, pos);
    if (text !== null && pos.offset < text.length) {
      if (text.charAt(pos.offset) === ch) {
        push(
          pos.token,
          pos.spelling,
          pos.offset + 1,
          pos.firstKey,
          pos.offset + 1 === text.length,
          pos.path,
        );
      }
      continue;
    }
    // The token is done: the key must start a spelling of the next token that it may precede.
    const j = nextReal(m, pos.token + 1);
    const target = m.tokens[j];
    if (target === undefined) continue;
    const constraint =
      pos.token >= 0 && j === pos.token + 1
        ? (m.tokens[pos.token]?.spellings[pos.spelling]?.next ?? null)
        : null;
    const path: PathNode | null =
      pos.token < 0
        ? pos.path
        : { token: pos.token, firstKey: pos.firstKey, lastKey: pos.lastKey, prev: pos.path };
    const candidates = constraint !== null ? constraint : Array.from(target.spellings.keys());
    for (const k of candidates) {
      const sp = target.spellings[k];
      if (sp !== undefined && sp.text.charAt(0) === ch)
        push(j, k, 1, index, sp.text.length === 1, path);
    }
  }

  return next.length === 0 ? null : { positions: next, keys: index + 1 };
}

export function isComplete(m: StreamMatcher, s: StreamState): boolean {
  return s.positions.some(
    (pos) => !isInProgress(m, pos) && nextReal(m, pos.token + 1) >= m.tokens.length,
  );
}

// Keys that continue a token still in progress. Only meaningful once the stream is complete:
// they are the surplus keys a user may still type, such as the second n of `nn`.
export function extensions(m: StreamMatcher, s: StreamState): ReadonlySet<string> {
  const out = new Set<string>();
  if (!isComplete(m, s)) return out;
  for (const pos of s.positions) {
    const text = textOf(m, pos);
    if (text !== null && pos.offset < text.length) out.add(text.charAt(pos.offset));
  }
  return out;
}

// Number of leading prompts committed in every active position: a prompt is committed once all
// its tokens are done, and trailing skip tokens need no input. A position inside a token has
// committed only the tokens before it.
export function committedPrompts(m: StreamMatcher, s: StreamState): number {
  let committed = m.promptStarts.length;
  for (const pos of s.positions) {
    const boundary = isInProgress(m, pos) ? pos.token : nextReal(m, pos.token + 1);
    let count = 0;
    while (count < m.promptStarts.length) {
      const end = m.promptStarts[count + 1] ?? m.tokens.length;
      if (end > boundary) break;
      count += 1;
    }
    committed = Math.min(committed, count);
  }
  return committed;
}
