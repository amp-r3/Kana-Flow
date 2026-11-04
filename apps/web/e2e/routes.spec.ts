import { test, expect } from '@playwright/test';

test.describe('routes: direct visits, navigation without a reload, settings', () => {
  for (const [path, heading] of [
    ['/learn', 'Learn'],
    ['/stats', 'Statistics'],
    ['/settings', 'Settings'],
    ['/about', 'About'],
  ] as const) {
    test(`${path} opens from its address`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
      await expect(page).toHaveTitle(`${heading} — Nekotype`);
    });
  }

  test('an unknown path shows the not-found screen with a way back', async ({ page }) => {
    await page.goto('/no-such-screen');
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
    await page.getByRole('button', { name: 'Back to the trainer' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('prompt-arena')).toBeVisible();
  });

  test('navigation does not reload the page, and Back returns to a working trainer', async ({
    page,
  }) => {
    await page.goto('/');
    await page.evaluate(() => {
      Object.assign(window, { navigationMarker: 'kept' });
    });

    await page.getByRole('navigation').getByRole('link', { name: 'learn' }).click();
    await expect(page).toHaveURL(/\/learn$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Learn' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'learn' })).toHaveAttribute('aria-current', 'page');

    await page.getByRole('link', { name: 'about' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'About' })).toBeVisible();

    await page.goBack();
    await expect(page.getByRole('heading', { level: 1, name: 'Learn' })).toBeVisible();
    await page.goBack();
    await expect(page.getByTestId('prompt-arena')).toBeVisible();

    // No document load happened on the way.
    expect(await page.evaluate(() => Reflect.get(window, 'navigationMarker'))).toBe('kept');

    // The trainer works after coming back: focus is on the input and a key starts the test.
    await expect(page.locator('input[aria-label="Kana input sink"]')).toBeFocused();
    await page.keyboard.press('KeyA');
    await expect(page.getByTestId('live-kpm')).toBeVisible();
  });

  test('typing on another screen does not start a test', async ({ page }) => {
    await page.goto('/learn');
    await page.keyboard.press('KeyA');
    await page.getByRole('link', { name: 'test' }).click();
    await expect(page.getByTestId('live-kpm')).toHaveCount(0);
  });

  test('settings: Reset progress asks for confirmation and can be cancelled', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('button', { name: 'Reset Progress' }).click();

    const dialog = page.locator('dialog[open]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Are you sure');
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.locator('dialog[open]')).toHaveCount(0);

    await page.getByRole('button', { name: 'Reset Progress' }).click();
    await page.locator('dialog[open]').getByRole('button', { name: 'Reset Everything' }).click();
    await expect(page.locator('dialog[open]')).toHaveCount(0);
  });

  test('the language switch is in the navigation on every screen', async ({ page }) => {
    await page.goto('/about');
    await page.getByRole('radio', { name: 'RU' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'О проекте' })).toBeVisible();
    await expect(page).toHaveTitle('О проекте — Nekotype');
    await page.getByRole('radio', { name: 'EN' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'About' })).toBeVisible();
  });
});
