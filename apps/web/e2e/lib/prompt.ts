import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createEngine, engineTable } from '@nekotype/engine';

const engine = createEngine(engineTable);

/**
 * The canonical romaji of the prompt on display. The page does not carry the answer: it is worked
 * out here from the prompt's text, with the same engine and kana table the application uses
 * (docs/spec/engine.md, "canonical" is the first spelling of the strict table).
 */
export async function canonicalOfPrompt(page: Page): Promise<string> {
  const promptText = page.getByTestId('prompt-text');
  await expect(promptText).not.toHaveText('');
  const text = (await promptText.textContent()) ?? '';
  const matcher = engine.compile([{ key: 'e2e', text }], 'ime');
  return engine.canonical(matcher, 0);
}
