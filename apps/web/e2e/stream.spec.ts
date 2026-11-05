import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { canonicalOfPrompt } from './lib/prompt';

const RESTART = { name: 'Restart test' };

async function box(page: Page, testId: string) {
  const found = await page.getByTestId(testId).boundingBox();
  if (found === null) throw new Error(`${testId} has no box`);
  return found;
}

test.describe('the text stream', () => {
  test('keeps the answer out of the DOM: tests work it out from the prompt text', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByTestId('prompt-arena')).toHaveAttribute('data-phase', 'idle');
    await expect(page.getByTestId('prompt-text')).not.toHaveText('');
    await expect(page.locator('[data-canonical]')).toHaveCount(0);
  });

  test('shows the prompt to type and the prompts after it, with the caret at the start', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByTestId('prompt-arena')).toHaveAttribute('data-phase', 'idle');

    // Many tokens are drawn, numbered from 0, and the first prompt is the one to type.
    const tokens = page.locator('[data-token]');
    expect(await tokens.count()).toBeGreaterThan(20);
    await expect(tokens.first()).toHaveAttribute('data-token', '0');
    const first = await page.getByTestId('prompt-text').innerText();
    expect(first.length).toBeGreaterThan(0);
    await expect(page.locator('.nk-caret')).toBeVisible();
  });

  test('the caret moves and the typed kana change colour, without the text moving', async ({
    page,
  }) => {
    await page.goto('/');
    const caret = page.locator('.nk-caret');
    const before = await caret.evaluate((el) => el.style.transform);
    const arenaBefore = await box(page, 'prompt-arena');

    const word = await canonicalOfPrompt(page);
    await page.keyboard.type(word, { delay: 20 });

    // The first prompt is typed: its token is in the typed colour, the caret moved on.
    await expect(page.locator('[data-token="0"]')).toHaveClass(/is-correct/);
    await expect.poll(() => caret.evaluate((el) => el.style.transform)).not.toBe(before);
    // The first token is typed even when the stream scrolled on a line.
    const arenaAfter = await box(page, 'prompt-arena');
    expect(arenaAfter.x).toBe(arenaBefore.x);
    expect(arenaAfter.width).toBe(arenaBefore.width);
    expect(arenaAfter.height).toBe(arenaBefore.height);
  });

  test('a wrong key marks the token and flashes the caret', async ({ page }) => {
    await page.goto('/');
    // Watch the flash: the writer animates the caret's flash layer through opacity.
    await page.locator('.nk-caret__reject').evaluate((el) => {
      const original = el.animate.bind(el);
      el.animate = (keyframes, options) => {
        Object.assign(window, { flashed: true });
        return original(keyframes, options);
      };
    });

    await page.keyboard.press('Digit1'); // ignored: not a letter
    await page.keyboard.press('KeyZ'); // never the start of a kana
    await expect(page.locator('[data-token="0"]')).toHaveClass(/is-miss/);
    await expect(page.getByTestId('prompt-arena')).toHaveAttribute('data-rejected', 'true');
    await expect.poll(() => page.evaluate(() => Reflect.get(window, 'flashed'))).toBe(true);
  });

  test('the translation of a word is shown under the stream', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('radio', { name: 'Words' }).click();
    await expect(page.getByTestId('prompt-text')).toHaveText(/^.{2,}$/);
    await expect(page.getByTestId('translation')).not.toHaveText('');
  });

  test('the stream shows two lines on a phone and three on a wide screen', async ({
    page,
  }, testInfo) => {
    await page.goto('/');
    // Rows of tokens that are inside the clipped view.
    const rows = () =>
      page.evaluate(() => {
        const view = document.querySelector('.nk-test__text')?.getBoundingClientRect();
        if (view === undefined) return 0;
        const tops = new Set<number>();
        for (const token of document.querySelectorAll('[data-token]')) {
          const r = token.getBoundingClientRect();
          if (r.top >= view.top - 1 && r.bottom <= view.bottom + 1) tops.add(Math.round(r.top));
        }
        return tops.size;
      });
    await expect.poll(rows).toBe(testInfo.project.name === 'webkit-mobile' ? 2 : 3);
  });
});

test.describe('the interface while a test runs', () => {
  test('starting a test hides the navigation, the modes and the footer without moving the text', async ({
    page,
  }) => {
    await page.goto('/');
    const before = await box(page, 'prompt-arena');
    await expect(page.getByRole('navigation')).toBeVisible();

    await page.keyboard.press('KeyA');
    await expect(page.getByTestId('prompt-arena')).toHaveAttribute('data-phase', 'running');
    await expect(page.getByRole('navigation')).toBeHidden();
    await expect(page.getByRole('radiogroup').first()).toBeHidden();
    await expect(page.getByRole('contentinfo')).toBeHidden();

    // Nothing moved: the interface only faded.
    const after = await box(page, 'prompt-arena');
    expect(after).toEqual(before);
  });

  test('the first Tab reaches Restart, and Enter restarts', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('KeyA');
    await expect(page.getByTestId('prompt-arena')).toHaveAttribute('data-phase', 'running');

    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', RESTART)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('prompt-arena')).toHaveAttribute('data-phase', 'idle');
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('a mouse movement brings the interface back, and the next key hides it again', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name === 'webkit-mobile', 'a touch screen has no mouse');
    await page.goto('/');
    await page.keyboard.press('KeyA');
    await expect(page.getByRole('navigation')).toBeHidden();

    await page.mouse.move(300, 300);
    await page.mouse.move(420, 380);
    await expect(page.getByRole('navigation')).toBeVisible();

    await page.keyboard.press('KeyA');
    await expect(page.getByRole('navigation')).toBeHidden();
  });

  test('Restart shows when it has the focus, and always on a touch screen', async ({
    page,
  }, testInfo) => {
    await page.goto('/');
    const restart = page.getByRole('button', RESTART);
    if (testInfo.project.name === 'webkit-mobile') {
      await expect(restart).toHaveCSS('opacity', '1');
      return;
    }
    await expect(restart).toHaveCSS('opacity', '0');
    await page.keyboard.press('Tab');
    await expect(restart).toBeFocused();
    await expect(restart).toHaveCSS('opacity', '1');
  });
});
