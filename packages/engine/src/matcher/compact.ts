import type { PathNode, Matcher, Position, MatchState } from './types';
import { settledPrompts } from './observe';
import { isInProgress, nextReal, START } from './step';

function rebasePath(path: PathNode | null, dropped: number): PathNode | null {
  if (path === null || path.token < dropped) return null;
  return { ...path, token: path.token - dropped, prev: rebasePath(path.prev, dropped) };
}

// Drops the settled prompts (no timing is lost: committedTimings() only covers tokens still in the
// matcher) and rebases token indices by the number of dropped tokens. A position that had completed a dropped token becomes a start position. That
// loses nothing: only the bare n of ん constrains what follows, and a bare n always has the
// in-progress `nn` beside it, which blocks compaction until the next key. If a hand-made state
// breaks this, nothing is dropped. Keystroke indices are not rebased.
export function compact(
  m: Matcher,
  s: MatchState,
): { m: Matcher; s: MatchState; droppedTokens: number } {
  const n = settledPrompts(m, s);
  if (n === 0) return { m, s, droppedTokens: 0 };
  const dropped = m.promptStarts[n] ?? m.tokens.length;

  const positions: Position[] = [];
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

  const matcher: Matcher = {
    tokens: m.tokens.slice(dropped).map((t) => ({ ...t, promptIndex: t.promptIndex - n })),
    promptStarts: m.promptStarts.slice(n).map((x) => x - dropped),
    strictness: m.strictness,
  };
  return { m: matcher, s: { positions, keys: s.keys }, droppedTokens: dropped };
}
