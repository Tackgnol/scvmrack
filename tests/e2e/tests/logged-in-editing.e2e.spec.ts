import { expect, test } from '@playwright/test';
import { registerAndLogin } from './utils/auth.js';
import { runCharacterSheetEditingSteps } from './utils/character-sheet.js';

test.beforeEach(async ({ context }) => {
  // Clear cookies to prevent stale session issues between parallel tests
  await context.clearCookies();
  await context.addInitScript(() => {
    localStorage.setItem(
      'scvmgrinder-privacy-settings-v1',
      JSON.stringify({ acknowledged: true, analyticsEnabled: false })
    );
  });
});

test.describe('Logged-in Editing', () => {
  test('Logged-in user can edit character sheet entirely and it saves', async ({ page }) => {
    // 18+ steps each with a 1-second debounce flush — plus login time
    test.setTimeout(90000);

    const email = `editor_${Date.now()}@example.com`;
    await registerAndLogin(page, email);

    // After logging in via the verification link, we should be on a valid character sheet (usually the one passed in callbackURL or a freshly loaded one).
    // Wait for the new user character to sync initially.
    const syncBadge = page.getByText('Synced', { exact: true });
    await expect(syncBadge).toBeVisible({ timeout: 20000 });

    await runCharacterSheetEditingSteps(page);
  });
});
