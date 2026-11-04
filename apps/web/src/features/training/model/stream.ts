import type { Matcher } from '@/entities/prompt';

// The text stream shows the prompts around the caret (docs/spec/frontend.md, "Text stream"). The
// window is measured in tokens, because a screen holds a number of characters, not of prompts.
//
// Tokens are counted from the start of the test ("absolute"), not from the start of the matcher:
// `compact()` drops committed prompts and renumbers what is left, but a token the stream draws keeps
// its number, so nothing in the view has to be rebased when that happens.

/** Tokens kept in the matcher after the end of the displayed prompt: more than the lines can show. */
export const AHEAD_TOKENS = 60;
/** Tokens kept behind the caret, so the line already typed is still on screen above the current one. */
export const BEHIND_TOKENS = 30;
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

/** The prompts to draw, in order. A new object only when a prompt enters or leaves the window. */
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

/** How many leading prompts end more than BEHIND_TOKENS before the caret; the last one never goes. */
export function staleCount(prompts: readonly StreamPrompt[], caret: number): number {
  let stale = 0;
  while (stale < prompts.length - 1) {
    const prompt = prompts[stale];
    if (prompt === undefined || lastToken(prompt) >= caret - BEHIND_TOKENS) break;
    stale += 1;
  }
  return stale;
}
