import { expect, test } from '../../fixtures';

const SHEET_URL = /\/character\/([0-9a-f-]{36})$/;

async function pickClassAndReachSheet(page: import('@playwright/test').Page) {
  const firstClass = page.getByTestId(/class-gate-class-/).first();
  await expect(firstClass).toBeVisible({ timeout: 30000 });
  await firstClass.click();
  await expect(page.getByTestId('draft-stats')).toBeVisible({ timeout: 30000 });
}

test.describe('guest character creation', () => {
  test('a fresh guest forges their first scvm with no replace warning', async ({ page }) => {
    test.setTimeout(90000);

    await page.goto('/character/create');
    await pickClassAndReachSheet(page);

    // No existing scvm yet, so nothing is being replaced.
    await expect(page.getByTestId('create-replace-notice')).toHaveCount(0);

    const created = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/api/characters/new' &&
        response.status() === 201
    );
    await page.getByTestId('create-confirm-button').click();
    await created;

    await expect(page).toHaveURL(SHEET_URL);
  });

  test('a guest forging again replaces their one scvm via the confirm modal', async ({ page }) => {
    test.setTimeout(120000);

    // 1. Bootstrap the guest's single scvm on the sheet route, then capture it.
    await page.goto('/character');
    await expect(page.getByTestId('generate-new-button')).toBeVisible({ timeout: 45000 });
    await expect(page).toHaveURL(SHEET_URL);
    const oldId = SHEET_URL.exec(page.url())?.[1];
    expect(oldId).toBeTruthy();

    // 2. Forging again must warn that it replaces the existing scvm.
    await page.goto('/character/create');
    await expect(page.getByTestId('create-replace-notice')).toBeVisible({ timeout: 15000 });

    await pickClassAndReachSheet(page);

    // 3. Confirm opens the replace gate rather than creating immediately.
    await page.getByTestId('create-confirm-button').click();
    const replaceButton = page.getByTestId('forge-replace-confirm');
    await expect(replaceButton).toBeVisible();

    const created = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/api/characters/new' &&
        response.status() === 201
    );
    await replaceButton.click();
    const newId = ((await (await created).json()) as { id?: string }).id;
    expect(newId).toBeTruthy();
    expect(newId).not.toBe(oldId);

    // 4. We land on the new scvm...
    await expect(page).toHaveURL(new RegExp(`/character/${newId}$`));

    // 5. ...and the backend pruned the old one (one scvm per guest).
    const oldLookup = await page.request.get(`/api/characters/${oldId}`);
    expect(oldLookup.status()).toBe(404);
  });
});
