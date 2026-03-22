import { expect, test } from '@playwright/test';
import { runCharacterSheetEditingSteps } from './utils/character-sheet.js';

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    localStorage.setItem(
      'scvmgrinder-privacy-settings-v1',
      JSON.stringify({ acknowledged: true, analyticsEnabled: false })
    );
  });
});

test.describe('Guest Editing', () => {
  test('Guest can edit character sheet entirely and it saves', async ({ page }) => {
    // 18+ steps each with a 1-second debounce flush — needs more than the default 30s
    test.setTimeout(60000);

    // Navigate directly and rely on UI state for readiness
    await page.goto('/');
    await expect(page.getByTestId('app-title')).toBeVisible({ timeout: 15000 });

    // Wait for the character to be fully loaded (generate button means page is interactive)
    await expect(page.getByTestId('generate-new-button')).toBeVisible({ timeout: 30000 });

    await runCharacterSheetEditingSteps(page);
  });
});
