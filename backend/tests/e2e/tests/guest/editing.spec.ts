import { expect, test } from '../../fixtures';
import { runCharacterSheetEditingSteps } from '../utils/character-sheet.js';

test.describe('Guest Editing', () => {
  test('Guest can edit character sheet entirely and it saves', async ({ page }) => {
    // 18+ steps each with a 1-second debounce flush — needs more than the default 30s
    test.setTimeout(60000);

    // Navigate directly and rely on UI state for readiness
    await page.goto('/character');
    await expect(page.getByTestId('app-title')).toBeVisible({ timeout: 15000 });

    // Wait for the character to be fully loaded (generate button means page is interactive)
    await expect(page.getByTestId('generate-new-button')).toBeVisible({ timeout: 30000 });
    // After auto-creation, URL is /character/<id> or /character?character=<id>
    await expect(page).toHaveURL(/\/character(\/|\?character=)[a-f0-9-]+/, { timeout: 30000 });

    await runCharacterSheetEditingSteps(page);
  });
});
