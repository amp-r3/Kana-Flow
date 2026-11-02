import type { StreamMatcher, StreamPosition, StreamState } from './types';

// Index of the first token at or after `from` that needs input (skip tokens are passed over).
export function nextReal(m: StreamMatcher, from: number): number {
  let j = from;
  for (;;) {
    const t = m.tokens[j];
    if (t === undefined || t.kind !== 'skip') return j;
    j += 1;
  }
}

function textOf(m: StreamMatcher, pos: StreamPosition): string | null {
  if (pos.token < 0) return null;
  return m.tokens[pos.token]?.spellings[pos.spelling]?.text ?? null;
}

export function start(): StreamState {
  return { positions: [{ token: -1, spelling: 0, offset: 0 }] };
}

export function step(m: StreamMatcher, s: StreamState, key: string): StreamState | null {
  const ch = key.toLowerCase();
  const next: StreamPosition[] = [];
  const seen = new Set<number>();
  const push = (token: number, spelling: number, offset: number): void => {
    const id = ((token + 1) * 256 + spelling) * 16 + offset;
    if (seen.has(id)) return;
    seen.add(id);
    next.push({ token, spelling, offset });
  };

  for (const pos of s.positions) {
    const text = textOf(m, pos);
    if (text !== null && pos.offset < text.length) {
      if (text.charAt(pos.offset) === ch) push(pos.token, pos.spelling, pos.offset + 1);
      continue;
    }
    // The token is done: the key must start a spelling of the next token that it may precede.
    const j = nextReal(m, pos.token + 1);
    const target = m.tokens[j];
    if (target === undefined) continue;
    const constraint =
      j === pos.token + 1 ? (m.tokens[pos.token]?.spellings[pos.spelling]?.next ?? null) : null;
    if (constraint !== null) {
      for (const k of constraint) {
        if (target.spellings[k]?.text.charAt(0) === ch) push(j, k, 1);
      }
    } else {
      for (let k = 0; k < target.spellings.length; k++) {
        if (target.spellings[k]?.text.charAt(0) === ch) push(j, k, 1);
      }
    }
  }

  return next.length === 0 ? null : { positions: next };
}

export function isComplete(m: StreamMatcher, s: StreamState): boolean {
  return s.positions.some((pos) => {
    const text = textOf(m, pos);
    const done = text === null || pos.offset >= text.length;
    return done && nextReal(m, pos.token + 1) >= m.tokens.length;
  });
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
