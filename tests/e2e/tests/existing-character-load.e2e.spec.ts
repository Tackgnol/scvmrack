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

test.describe('Existing character loading on root visit', () => {
  test('loads existing character instead of creating new one when localStorage is cleared', async ({ page }) => {
    test.setTimeout(60000);

    // 1. First visit — a character is auto-created (list is empty for fresh session)
    await page.goto('/');
    await expect(page.getByTestId('app-title')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('generate-new-button')).toBeVisible({ timeout: 30000 });

    // Grab the character ID from the URL (use toHaveURL — SPA history.replace doesn't trigger navigation events)
    await expect(page).toHaveURL(/character=/, { timeout: 15000 });
    const firstUrl = new URL(page.url());
    const originalCharacterId = firstUrl.searchParams.get('character');
    expect(originalCharacterId).toBeTruthy();

    // 2. Edit HP to a known value so we can verify the same character loads later
    const hpInput = page.getByTestId('hp-input');
    await hpInput.fill('3');
    await hpInput.blur();

    // Wait for the save cycle: "Saving..." appears when the debounce flushes,
    // then "Synced" reappears once the PATCH completes.
    const savingBadge = page.getByText('Saving...', { exact: true });
    const syncBadge = page.getByText('Synced', { exact: true });
    await expect(savingBadge).toBeVisible({ timeout: 5000 });
    await expect(syncBadge).toBeVisible({ timeout: 10000 });

    // 3. Clear localStorage to simulate "forgotten" character ID
    await page.evaluate(() => {
      localStorage.removeItem('last-character-id');
    });

    // 4. Navigate to "/" again — should fetch existing characters list, then load our character
    await page.goto('/');
    await expect(page.getByTestId('app-title')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('generate-new-button')).toBeVisible({ timeout: 30000 });

    // 5. Verify it loaded the SAME character (URL has the original ID)
    await expect(page).toHaveURL(new RegExp(`character=${originalCharacterId}`), { timeout: 15000 });

    // Verify the edited HP value persisted — proves it's the same character, not a new one
    await expect(page.getByTestId('hp-input')).toHaveValue('3', { timeout: 15000 });
  });

  test('creates new character when no existing characters on server (fresh session)', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto('/');
    await expect(page.getByTestId('app-title')).toBeVisible({ timeout: 15000 });

    // Character should be created and page should become interactive
    await expect(page.getByTestId('generate-new-button')).toBeVisible({ timeout: 30000 });
  });
});
