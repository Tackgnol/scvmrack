import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'scvmgrinder-privacy-settings-v1',
      JSON.stringify({ acknowledged: true, analyticsEnabled: false })
    );
  });
});

test('home page can generate a character via FE and receive backend response', async ({ page }) => {
  const generateResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/characters/new') &&
      response.request().method() === 'POST' &&
      response.status() === 201,
    { timeout: 45000 }
  );

  await page.goto('/');
  await expect(page.getByTestId('app-title')).toBeVisible();

  const generateResponse = await generateResponsePromise;

  expect(generateResponse.ok()).toBe(true);
  await expect(page.getByTestId('generate-new-button')).toBeVisible();
});

test('guest user sees login warning on characters list route', async ({ page }) => {
  await page.goto('/characters');

  await expect(page.getByTestId('characters-guest-warning')).toBeVisible({ timeout: 15000 });
});
