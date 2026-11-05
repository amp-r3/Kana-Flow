import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { canonicalOfPrompt } from './lib/prompt';

const FINISH = { name: /^Finish/ };

async function chooseZen(page: Page): Promise<void> {
  await page.goto('/');
  const zen = page.getByRole('radio', { name: 'Zen' });
  await zen.click();
  await expect(zen).toHaveAttribute('aria-checked', 'true');
}

// Types the prompts one after another, from the canonical romaji of each prompt on display.
async function typePrompts(page: Page, count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    const canonical = await canonicalOfPrompt(page);
    const glyph = await page.getByTestId('prompt-text').innerText();
    await page.keyboard.type(canonical, { delay: 15 });
    if (i < count - 1) {
      await expect(page.getByTestId('prompt-text')).not.toHaveText(glyph, { timeout: 2000 });
    }
  }
}

test.describe('zen: a test without a length, ended by hand', () => {
  test('has no length control and is remembered across a reload', async ({ page }) => {
    await chooseZen(page);
    await expect(page.getByRole('radiogroup', { name: 'Time seconds' })).toHaveCount(0);
    await expect(page.getByRole('radiogroup', { name: 'Count prompts' })).toHaveCount(0);

    // The settings are saved after a short delay.
    await page.waitForTimeout(450);
    await page.reload();
    await expect(page.getByRole('radio', { name: 'Zen' })).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByRole('button', FINISH)).toBeVisible();

    // Back to time: the length returns.
    await page.getByRole('radio', { name: 'Time' }).click();
    await expect(page.getByRole('radiogroup', { name: 'Time seconds' })).toBeVisible();
    await expect(page.getByRole('button', FINISH)).toHaveCount(0);
  });

  test('counts the prompts, enables Finish when it starts, and shows the result', async ({
    page,
  }) => {
    await chooseZen(page);
    const finish = page.getByRole('button', FINISH);
    await expect(finish).toBeDisabled();
    await expect(page.getByTestId('live-counter')).toHaveText('0');

    await typePrompts(page, 4);
    await expect(finish).toBeEnabled();
    // The last prompt may wait for the next key (a final ん is settled by it).
    await expect(page.getByTestId('live-counter')).toHaveText(/^[3-4]$/);
    // Zen does not end by itself.
    await page.waitForTimeout(1500);
    await expect(page.getByTestId('prompt-arena')).toHaveAttribute('data-phase', 'running');

    await finish.click();
    await expect(page.getByTestId('results-panel')).toBeVisible();
    // The results take the focus themselves; wait for it so a slow runner cannot press too early.
    await expect(page.getByRole('button', { name: 'Next Test' })).toBeFocused();
    await page.keyboard.press('Enter');
    // Next test: the same zen config, idle.
    await expect(page.getByTestId('prompt-arena')).toHaveAttribute('data-phase', 'idle');
    await expect(page.getByRole('radio', { name: 'Zen' })).toHaveAttribute('aria-checked', 'true');
  });

  test('Ctrl+Enter ends the test', async ({ page }) => {
    await chooseZen(page);
    await typePrompts(page, 3);
    await page.keyboard.press('Control+Enter');
    await expect(page.getByTestId('results-panel')).toBeVisible();
  });

  test('Cmd+Enter ends the test', async ({ page }) => {
    await chooseZen(page);
    await typePrompts(page, 3);
    await page.keyboard.press('Meta+Enter');
    await expect(page.getByTestId('results-panel')).toBeVisible();
  });

  test('with no prompt completed it starts a new test and shows no result', async ({ page }) => {
    await chooseZen(page);
    await page.keyboard.press('KeyZ'); // a key, so the test has started, but no kana is typed
    await expect(page.getByTestId('prompt-arena')).toHaveAttribute('data-phase', 'running');

    await page.keyboard.press('Control+Enter');
    await expect(page.getByTestId('prompt-arena')).toHaveAttribute('data-phase', 'idle');
    await expect(page.getByTestId('results-panel')).toHaveCount(0);
    // The interface is back and typing works at once.
    await expect(page.getByRole('navigation')).toBeVisible();
    await page.keyboard.press('KeyZ');
    await expect(page.getByTestId('prompt-arena')).toHaveAttribute('data-phase', 'running');
  });

  test('Ctrl+Enter does nothing in a test that is not zen', async ({ page }) => {
    await page.goto('/');
    await typePrompts(page, 2);
    await page.keyboard.press('Control+Enter');
    await expect(page.getByTestId('prompt-arena')).toHaveAttribute('data-phase', 'running');
    await expect(page.getByTestId('results-panel')).toHaveCount(0);
  });

  test('the first Tab still reaches Restart, with Finish after it', async ({ page }) => {
    await chooseZen(page);
    await page.keyboard.press('KeyZ');
    // Finish is enabled once the test runs; a Tab before that would skip it.
    await expect(page.getByRole('button', FINISH)).toBeEnabled();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Restart test' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', FINISH)).toBeFocused();
  });

  test('keeps the stream going over many prompts', async ({ page }) => {
    await chooseZen(page);
    // The window is trimmed in steps, once more than 60 tokens lie behind the caret.
    await typePrompts(page, 70);
    // A window around the caret, not the whole test, and the first token numbers keep rising.
    const first = Number(await page.locator('[data-token]').first().getAttribute('data-token'));
    expect(first).toBeGreaterThan(0);
    expect(await page.locator('[data-token]').count()).toBeLessThan(200);
  });
});
