import type { PathNode, StreamMatcher, StreamPosition, StreamState } from './types';
import { committedTimings } from './observe';
import { committedPrompts, isInProgress, nextReal } from './step';

function rebasePath(path: PathNode | null, dropped: number): PathNode | null {
  if (path === null || path.token < dropped) return null;
  return { ...path, token: path.token - dropped, prev: rebasePath(path.prev, dropped) };
}

const START: StreamPosition = {
  token: -1,
  spelling: 0,
  offset: 0,
  firstKey: 0,
  lastKey: -1,
  path: null,
};

// Prompts that are committed and whose tokens all have agreed timings. A prompt that is committed
// while the paths still disagree on the keystrokes of its last ん waits for the next key, so no
// timing is lost: committedTimings() only covers tokens that are still in the matcher.
function droppablePrompts(m: StreamMatcher, s: StreamState): number {
  const committed = committedPrompts(m, s);
  if (committed === 0) return 0;
  const agreed = new Set(committedTimings(m, s).map((t) => t.tokenIndex));
  const limit = m.promptStarts[committed] ?? m.tokens.length;
  const unsettled = m.tokens
    .slice(0, limit)
    .findIndex((t, i) => t.kind !== 'skip' && !agreed.has(i));
  const settled = unsettled === -1 ? limit : unsettled;
  let k = 0;
  while (k < committed && (m.promptStarts[k + 1] ?? m.tokens.length) <= settled) k += 1;
  return k;
}

// Drops the prompts committed in every active position and rebases token indices by the number of
// dropped tokens. A position that had completed a dropped token becomes a start position. That
// loses nothing: only the bare n of ん constrains what follows, and a bare n always has the
// in-progress `nn` beside it, which blocks compaction until the next key. If a hand-made state
// breaks this, nothing is dropped. Keystroke indices are not rebased.
export function compact(
  m: StreamMatcher,
  s: StreamState,
): { m: StreamMatcher; s: StreamState; droppedTokens: number } {
  const n = droppablePrompts(m, s);
  if (n === 0) return { m, s, droppedTokens: 0 };
  const dropped = m.promptStarts[n] ?? m.tokens.length;

  const positions: StreamPosition[] = [];
  let hasStart = false;
  for (const pos of s.positions) {
    if (isInProgress(m, pos) || pos.token >= dropped) {
      positions.push({ ...pos, token: pos.token - dropped, path: rebasePath(pos.path, dropped) });
      continue;
    }
    const constrained =
      pos.token >= 0 &&
      nextReal(m, pos.token + 1) === pos.token + 1 &&
      m.tokens[pos.token]?.spellings[pos.spelling]?.next != null;
    if (constrained) return { m, s, droppedTokens: 0 };
    if (!hasStart) positions.push(START);
    hasStart = true;
  }

  const matcher: StreamMatcher = {
    tokens: m.tokens.slice(dropped).map((t) => ({ ...t, promptIndex: t.promptIndex - n })),
    promptStarts: m.promptStarts.slice(n).map((x) => x - dropped),
    strictness: m.strictness,
  };
  return { m: matcher, s: { positions, keys: s.keys }, droppedTokens: dropped };
}
