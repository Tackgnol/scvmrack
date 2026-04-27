import { expect, test } from '../../fixtures';

test('guest user sees login warning on characters list route', async ({ page }) => {
  await page.goto('/characters');
  await expect(page.getByTestId('characters-guest-warning')).toBeVisible({ timeout: 15000 });
});
