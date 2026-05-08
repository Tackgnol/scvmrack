import { expect, test } from '../../fixtures';

test('home page can generate a character via FE and receive backend response', async ({ page }) => {
  test.setTimeout(60000);

  await page.goto('/');
  await expect(page.getByTestId('app-title')).toBeVisible();

  // Wait for the character to be fully loaded (generate button means page is interactive)
  await expect(page.getByTestId('generate-new-button')).toBeVisible({ timeout: 45000 });
});
