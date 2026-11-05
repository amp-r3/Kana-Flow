import type { Matcher } from '@/entities/prompt';

// The text stream shows the prompts around the caret (docs/spec/frontend.md, "Text stream"). The
// window is measured in tokens, because a screen holds a number of characters, not of prompts.
//
// Tokens are counted from the start of the test ("absolute"), not from the start of the matcher:
// `compact()` drops committed prompts and renumbers what is left, but a token the stream draws keeps
// its number, so nothing in the view has to be rebased when that happens.
//
// The stream the view draws is not changed at every completed prompt: a change redraws a hundred
// tokens and forces their layout, which is more than a keystroke may cost (quality.md). It is
// published in steps instead, when the tokens ahead run low or enough tokens behind can leave, so
// most completed prompts change nothing in the DOM. What leaves is whole lines: the view reports the
// first token of the line above the caret (`trimBefore`), and a window that starts there wraps
// exactly as the one it replaces (ADR 047).

/** Tokens kept in the matcher after the end of the displayed prompt: the target of a refill. */
export const AHEAD_TOKENS = 72;
/** A published window is refreshed before fewer than this many tokens remain ahead of the caret. */
export const MIN_AHEAD_TOKENS = 44;
/** A published window is trimmed when this many tokens, whole lines of them, can leave its head. */
export const MIN_TRIM_TOKENS = 60;
/**
 * A cap on the tokens kept behind the caret, for a view that reports no lines (it has no layout, or
 * all the text is on one line): the stream of a zen test must not grow without limit.
 */
export const HARD_BEHIND_TOKENS = 300;
/** A guard against a source of prompts without tokens. */
export const MAX_WINDOW_PROMPTS = 150;

export type StreamToken = {
  readonly glyph: string;
  // Rendered, but needs no input: a space or punctuation. The caret passes over it.
  readonly skip: boolean;
};

export type StreamPrompt = {
  // Number of the prompt from the start of the test.
  readonly index: number;
  // Number of its first token from the start of the test.
  readonly firstToken: number;
  readonly tokens: readonly StreamToken[];
};

/** The prompts to draw, in order. A new object only when the window is published (see above). */
export type StreamSnapshot = {
  readonly prompts: readonly StreamPrompt[];
};

export const EMPTY_STREAM: StreamSnapshot = { prompts: [] };

/** A wrong key or a hint, charged to a token. `seq` makes two mistakes on one token distinct. */
export type Mistake = {
  readonly seq: number;
  readonly token: number;
  readonly kind: 'rejected' | 'hint';
};

/** The stream prompts for the matcher's prompts from `fromLocal` on. */
export function streamPromptsOf(
  matcher: Matcher,
  fromLocal: number,
  promptBase: number,
  tokenBase: number,
): StreamPrompt[] {
  const result: StreamPrompt[] = [];
  for (let p = fromLocal; p < matcher.promptStarts.length; p++) {
    const from = matcher.promptStarts[p] ?? matcher.tokens.length;
    const to = matcher.promptStarts[p + 1] ?? matcher.tokens.length;
    result.push({
      index: promptBase + p,
      firstToken: tokenBase + from,
      tokens: matcher.tokens
        .slice(from, to)
        .map((token) => ({ glyph: token.glyph, skip: token.kind === 'skip' })),
    });
  }
  return result;
}

export function lastToken(prompt: StreamPrompt): number {
  return prompt.firstToken + prompt.tokens.length - 1;
}

/**
 * Whether the view should be given `current`, the window with its stale head already cut: it has
 * none yet; the tokens ahead of the caret in the published one are running low and the current
 * window has more; or at least MIN_TRIM_TOKENS can leave the head of the published one.
 */
export function shouldPublish(
  published: readonly StreamPrompt[],
  current: readonly StreamPrompt[],
  caret: number,
): boolean {
  const firstCurrent = current[0];
  const lastCurrent = current.at(-1);
  if (firstCurrent === undefined || lastCurrent === undefined) return false;
  const firstPublished = published[0];
  const lastPublished = published.at(-1);
  if (firstPublished === undefined || lastPublished === undefined) return true;

  const refill =
    lastToken(lastCurrent) > lastToken(lastPublished) &&
    lastToken(lastPublished) - caret < MIN_AHEAD_TOKENS;
  const trim = firstCurrent.firstToken - firstPublished.firstToken >= MIN_TRIM_TOKENS;
  return refill || trim;
}

/** How many leading prompts end before token `trimBefore`; the last one never goes. */
export function staleCount(prompts: readonly StreamPrompt[], trimBefore: number): number {
  let stale = 0;
  while (stale < prompts.length - 1) {
    const prompt = prompts[stale];
    if (prompt === undefined || lastToken(prompt) >= trimBefore) break;
    stale += 1;
  }
  return stale;
}
