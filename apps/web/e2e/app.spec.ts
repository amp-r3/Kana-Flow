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

  test('(b) click a ConfigBar button, press a letter: focus is on the input AND the letter was processed (also with a wrong letter: mistake counted)', async ({
    page,
  }) => {
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

  test('(d) set words mode, reload: the first prompt is a word/phrase, never a single kana', async ({
    page,
  }) => {
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

  test('(e) Tab then Enter restarts the test', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('input[aria-label="Kana input sink"]');
    await expect(input).toBeFocused();

    // Start typing to enter running phase
    await page.keyboard.press('KeyA');
    await expect(page.locator('text=wpm')).toBeVisible();

    // Tab moves focus naturally to the restart button
    await page.keyboard.press('Tab');
    const restartBtn = page.getByRole('button', { name: 'Restart test' });
    await expect(restartBtn).toBeFocused();

    // Enter on the focused restart button resets the test back to idle
    await page.keyboard.press('Enter');
    await expect(page.locator('text=wpm')).toHaveCount(0);

    // Typing again immediately starts a fresh test
    await page.keyboard.press('KeyA');
    await expect(page.locator('text=wpm')).toBeVisible();
  });

  test('(f) a full count test (10 prompts, type canonical answers) ends on results screen, "Next test" via Enter starts a new idle test', async ({
    page,
  }) => {
    await page.goto('/');
    const input = page.locator('input[aria-label="Kana input sink"]');
    await expect(input).toBeFocused();

    // Configure Count test with 10 prompts
    const countRadio = page.getByRole('radio', { name: 'Count' });
    await countRadio.click();
    await expect(countRadio).toHaveAttribute('aria-checked', 'true');

    const tenPromptsRadio = page.getByRole('radio', { name: '10', exact: true });
    await tenPromptsRadio.click();
    await expect(tenPromptsRadio).toHaveAttribute('aria-checked', 'true');

    // Type canonical answers for all 10 prompts
    for (let i = 0; i < 10; i++) {
      const arena = page.locator('[data-canonical]');
      await expect(arena).toBeVisible();
      const canonical = await arena.getAttribute('data-canonical');
      const glyph = await page.locator('main .font-kana').innerText();

      if (i < 9) {
        if (canonical) {
          await page.keyboard.type(canonical, { delay: 15 });
        }
        // Wait for prompt to change to next one
        await expect(page.locator('main .font-kana')).not.toHaveText(glyph, { timeout: 2000 });
      } else {
        if (canonical) {
          await page.keyboard.type(canonical, { delay: 15 });
        }
      }
    }

    // After 10 prompts, the test completes automatically and renders ResultsPanel
    const nextTestBtn = page.getByRole('button', { name: 'Next Test' });
    await expect(nextTestBtn).toBeVisible({ timeout: 5000 });
    await expect(nextTestBtn).toBeFocused();

    // D20: the results panel fades in (`animate-fadeIn` used to be an undefined class)
    await expect(page.getByTestId('results-panel')).toHaveCSS('animation-name', 'fadeIn');

    // Press Enter to activate "Next Test" button
    await page.keyboard.press('Enter');

    // Results screen closes, returns to idle test stage with input focused
    await expect(nextTestBtn).toHaveCount(0);
    await expect(input).toBeFocused();
    await expect(page.locator('text=wpm')).toHaveCount(0);
  });

  test('(i) a count test over words (ん at the end of prompts, next prompt shown early) ends on the results screen', async ({
    page,
  }) => {
    await page.goto('/');
    const input = page.locator('input[aria-label="Kana input sink"]');
    await expect(input).toBeFocused();

    await page.getByRole('radio', { name: 'Count' }).click();
    await page.getByRole('radio', { name: '10', exact: true }).click();
    const words = page.getByRole('radio', { name: 'Words' });
    await words.click();
    await expect(words).toHaveAttribute('aria-checked', 'true');

    for (let i = 0; i < 10; i++) {
      const arena = page.locator('[data-canonical]');
      await expect(arena).toBeVisible();
      // Wait until the lazily loaded words are on screen and the hint belongs to the prompt shown
      await expect(arena).not.toHaveAttribute('data-canonical', '');
      const canonical = await arena.getAttribute('data-canonical');
      const glyph = await page.locator('main .font-kana').innerText();
      if (canonical) {
        await page.keyboard.type(canonical, { delay: 15 });
      }
      if (i < 9) {
        await expect(page.locator('main .font-kana')).not.toHaveText(glyph, { timeout: 2000 });
      }
    }

    await expect(page.getByRole('button', { name: 'Next Test' })).toBeVisible({ timeout: 5000 });
    // No mistakes: every answer was canonical
    await expect(page.getByTestId('results-panel')).toBeVisible();
  });

  test('(g) RU/EN switch changes a visible label and survives a reload', async ({ page }) => {
    await page.goto('/');

    // Check initial English label for matrix button
    const matrixBtn = page.getByRole('button', { name: 'Kana Matrix' });
    await expect(matrixBtn).toBeVisible();

    // Switch to Russian locale
    const ruRadio = page.getByRole('radio', { name: 'RU' });
    await ruRadio.click();
    await expect(ruRadio).toHaveAttribute('aria-checked', 'true');

    // Matrix button label updates to Russian
    const ruMatrixBtn = page.getByRole('button', { name: 'Таблица кана' });
    await expect(ruMatrixBtn).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'ru');

    // Allow 350ms for persistence
    await page.waitForTimeout(350);

    // Reload page
    await page.reload();

    // Label and lang attribute persist across reload
    await expect(page.getByRole('button', { name: 'Таблица кана' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'ru');

    // Clean up: switch back to English
    const enRadio = page.getByRole('radio', { name: 'EN' });
    await enRadio.click();
    await expect(page.getByRole('button', { name: 'Kana Matrix' })).toBeVisible();
  });

  test('(h) Space in the input does nothing; Esc reveals the answer and the prompt is assisted', async ({
    page,
  }) => {
    await page.goto('/');
    const input = page.locator('input[aria-label="Kana input sink"]');
    await expect(input).toBeFocused();

    // Check that revealed answer is not present initially
    await expect(page.locator('text=Revealed:')).toHaveCount(0);

    // Press Space inside the input sink
    await page.keyboard.press('Space');

    // Space is ignored: does not start test, does not reveal, does not count mistake
    await expect(page.locator('text=wpm')).toHaveCount(0);
    await expect(page.locator('text=Revealed:')).toHaveCount(0);

    // Press Escape inside the input sink
    await page.keyboard.press('Escape');

    // Escape triggers reveal: canonical romaji is shown
    await expect(page.locator('text=Revealed:')).toBeVisible();

    // Type canonical answer to complete the assisted prompt
    const arena = page.locator('[data-canonical]');
    const canonical = await arena.getAttribute('data-canonical');
    const firstGlyph = await page.locator('main .font-kana').innerText();
    if (canonical) {
      await page.keyboard.type(canonical, { delay: 15 });
    }

    // Prompt advances, test starts and reflects accuracy < 100% due to the reveal mistake
    await expect(page.locator('main .font-kana')).not.toHaveText(firstGlyph, { timeout: 2000 });
    await expect(page.locator('text=wpm')).toBeVisible();
    await expect(page.locator('text=100%')).toHaveCount(0);
  });
});
