import type { EngineView, PathNode, Matcher, Position, MatchState, TokenTiming } from './types';
import { committedPrompts, isInProgress, nextReal, pendingToken, textOf } from './step';

// Live conversion (spec "Display position"): the position with the shortest typed latin beyond
// its completed tokens; on a tie the one whose spelling comes first in table order, then the
// earlier token. Example, relaxed こんな: kon → こん, konn → こん, konna → こんな.
export function view(m: Matcher, s: MatchState): EngineView {
  let best: Position | null = null;
  let bestPending = '';
  for (const pos of s.positions) {
    const pending = isInProgress(m, pos) ? (textOf(m, pos) ?? '').slice(0, pos.offset) : '';
    const better =
      best === null ||
      pending.length < bestPending.length ||
      (pending.length === bestPending.length &&
        (pos.spelling < best.spelling ||
          (pos.spelling === best.spelling && pos.token < best.token)));
    if (better) {
      best = pos;
      bestPending = pending;
    }
  }
  const displayedTokens = best === null ? 0 : pendingToken(m, best);
  return { displayedTokens, pendingLatin: bestPending, activeToken: activeToken(m, s) };
}

// The token highlighted in the stream: conservative, the earliest token any active position is
// still typing. It can lag behind `displayedTokens`.
function activeToken(m: Matcher, s: MatchState): number {
  let min = m.tokens.length;
  for (const pos of s.positions) min = Math.min(min, pendingToken(m, pos));
  return min;
}

// Token that a rejected key or a hint is charged to (D10, A34): the minimum over active positions,
// but never before the prompt on display, whose word the user is typing, and never past the last
// token that needs input.
export function errorTarget(m: Matcher, s: MatchState): number {
  let last = m.tokens.length - 1;
  while (last > 0 && m.tokens[last]?.kind === 'skip') last -= 1;
  const shown = m.tokens[Math.min(view(m, s).displayedTokens, last)]?.promptIndex ?? 0;
  const shownFirst = nextReal(m, m.promptStarts[shown] ?? 0);
  return Math.max(0, Math.min(Math.max(activeToken(m, s), shownFirst), last));
}

function nodesOf(m: Matcher, pos: Position): Map<number, PathNode> {
  const nodes = new Map<number, PathNode>();
  for (let n = pos.path; n !== null; n = n.prev) nodes.set(n.token, n);
  if (pos.token >= 0 && !isInProgress(m, pos)) {
    nodes.set(pos.token, {
      token: pos.token,
      firstKey: pos.firstKey,
      lastKey: pos.lastKey,
      prev: null,
    });
  }
  return nodes;
}

// Timings of the tokens completed in every active position, for the tokens still in the matcher.
// A token is reported only when all positions agree on its keystrokes: after `konn` in relaxed
// こんな the ん is `n` on one path and `nn` on the other, and is reported once `a` settles it.
// Skip tokens consume no keystroke and never appear.
export function committedTimings(m: Matcher, s: MatchState): readonly TokenTiming[] {
  const lists = s.positions.map((pos) => nodesOf(m, pos));
  const [first, ...rest] = lists;
  if (first === undefined) return [];
  let limit = m.tokens.length;
  for (const pos of s.positions) {
    limit = Math.min(limit, isInProgress(m, pos) ? pos.token : pos.token + 1);
  }
  const out: TokenTiming[] = [];
  for (const [token, node] of first) {
    if (token >= limit) continue;
    const agreed = rest.every((other) => {
      const o = other.get(token);
      return o !== undefined && o.firstKey === node.firstKey && o.lastKey === node.lastKey;
    });
    if (agreed) out.push({ tokenIndex: token, firstKey: node.firstKey, lastKey: node.lastKey });
  }
  return out.sort((a, b) => a.tokenIndex - b.tokenIndex);
}

// Leading prompts that are committed and whose tokens all have agreed timings. A prompt that is
// committed while the paths still disagree on the keystrokes of its last ん waits for the next key.
export function settledPrompts(m: Matcher, s: MatchState): number {
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

// The first spelling of every token of the prompt. ん is always `nn`, so it does not change when
// the stream is extended.
export function canonical(m: Matcher, promptIndex: number): string {
  const from = m.promptStarts[promptIndex];
  if (from === undefined) return '';
  const to = m.promptStarts[promptIndex + 1] ?? m.tokens.length;
  return m.tokens
    .slice(from, to)
    .map((t) => t.spellings[0]?.text ?? '')
    .join('');
}
