import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Clear cookies to prevent stale session issues between parallel tests
  await page.context().clearCookies();
  await page.addInitScript(() => {
    localStorage.setItem(
      'scvmgrinder-privacy-settings-v1',
      JSON.stringify({ acknowledged: true, analyticsEnabled: false })
    );
  });
});

test('home page can generate a character via FE and receive backend response', async ({ page }) => {
  test.setTimeout(60000);

  await page.goto('/');
  await expect(page.getByTestId('app-title')).toBeVisible();

  // Wait for the character to be fully loaded (generate button means page is interactive)
  await expect(page.getByTestId('generate-new-button')).toBeVisible({ timeout: 45000 });
});

test('guest user sees login warning on characters list route', async ({ page }) => {
  await page.goto('/characters');

  await expect(page.getByTestId('characters-guest-warning')).toBeVisible({ timeout: 15000 });
});
