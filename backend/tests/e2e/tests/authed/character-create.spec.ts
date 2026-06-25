import { expect, test } from '../../fixtures.js';

test.describe('character creation flow', () => {
  test('pick class, re-roll stats, confirm, land on the sheet', async ({ page }) => {
    test.setTimeout(90000);

    await page.goto('/character/create');

    const firstClass = page.getByTestId(/class-gate-class-/).first();
    await expect(firstClass).toBeVisible({ timeout: 30000 });
    await firstClass.click();

    await expect(page.getByTestId('draft-stats')).toBeVisible({ timeout: 30000 });
    const nameBefore = (await page.getByTestId('draft-name-input').inputValue()).trim();

    const rerollResponse = page.waitForResponse((response) =>
      response.request().method() === 'POST' &&
      response.url().includes('/api/characters/draft/reroll/stats') &&
      response.ok()
    );
    await page.getByTestId('draft-stats-reroll').click();
    await rerollResponse;

    await expect(page.getByTestId('draft-name-input')).toHaveValue(nameBefore);

    const confirmResponse = page.waitForResponse((response) =>
      response.request().method() === 'POST' &&
      response.url().includes('/api/characters/new') &&
      response.status() === 201
    );
    await page.getByTestId('create-confirm-button').click();
    await confirmResponse;

    await expect(page).toHaveURL(/\/character\/[0-9a-f-]{36}$/);
  });
});
