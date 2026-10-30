import { test, expect } from '@playwright/test';

test.describe('focus redirection and keyboard-first typing', () => {
  test('(a) load, type immediately without clicking, the test starts', async ({ page }) => {
    await page.goto('/');

    const input = page.locator('input[aria-label="Kana input sink"]');
    await expect(input).toBeFocused();

    // Type a key immediately without clicking anywhere
    await page.keyboard.press('KeyA');

    // The test must have started (live stats strip shows wpm counter)
    await expect(page.locator('text=wpm')).toBeVisible();
  });

  test('(b) click a ConfigBar button, press a letter: focus is on the input AND the letter was processed (also with a wrong letter: mistake counted)', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('input[aria-label="Kana input sink"]');

    // Click a ConfigBar button (e.g. Katakana) to steal focus from input
    const katakanaBtn = page.getByRole('radio', { name: 'Katakana' });
    await katakanaBtn.click();
    await expect(katakanaBtn).toBeFocused();

    // Press a wrong letter key (e.g. 'z' which is not a basic kana)
    await page.keyboard.press('KeyZ');

    // Focus must immediately move back to input
    await expect(input).toBeFocused();

    // Test starts and records mistake (shake animation class applied)
    await expect(page.locator('text=wpm')).toBeVisible();
    const arena = page.locator('.animate-shake');
    await expect(arena).toBeAttached();
  });

  test('(c) open and close the rows dialog: focus returns, typing works', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('input[aria-label="Kana input sink"]');

    // Open rows dialog
    const rowsBtn = page.getByRole('button', { name: 'Kana Matrix' });
    await rowsBtn.click();

    const dialog = page.locator('dialog[open]');
    await expect(dialog).toBeVisible();

    // Close dialog
    const closeBtn = dialog.getByLabel('Close');
    await closeBtn.click();
    await expect(page.locator('dialog[open]')).toHaveCount(0);

    // Type a key: focus returns to input and test starts
    await page.keyboard.press('KeyA');
    await expect(input).toBeFocused();
    await expect(page.locator('text=wpm')).toBeVisible();
  });

  test('(d) set words mode, reload: the first prompt is a word/phrase, never a single kana', async ({ page }) => {
    await page.goto('/');

    const input = page.locator('input[aria-label="Kana input sink"]');
    await expect(input).toBeFocused();

    // Switch to Words mode
    const wordsBtn = page.getByRole('radio', { name: 'Words' });
    await wordsBtn.click();
    await expect(wordsBtn).toHaveAttribute('aria-checked', 'true');

    // Allow 350ms for debounced persistence to localStorage
    await page.waitForTimeout(350);

    // Reload the page
    await page.reload();
    await expect(input).toBeFocused();

    // First prompt must be a word/phrase (length >= 2 characters, never a single kana)
    const promptElement = page.locator('main .font-kana');
    await expect(async () => {
      const text = await promptElement.innerText();
      expect(text.length).toBeGreaterThanOrEqual(2);
    }).toPass({ timeout: 5000 });
  });
});
