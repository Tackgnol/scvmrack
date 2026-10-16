import { expect, test } from '../../fixtures';
import { fillAndSave } from '../utils/character-sheet.js';

test('reload warns about a pending edit and canceling lets it save', async ({ page, seededCharacter }) => {
  await page.goto(`/character/${seededCharacter.id}`);
  await expect(page.getByTestId('habit-input')).toBeVisible();
  await fillAndSave(page, 'habit-input', 'Saved habit');
  const saved = page.waitForResponse((response) =>
    response.request().method() === 'PATCH' && response.url().includes(`/api/characters/${seededCharacter.id}`)
  );
  const warning = page.waitForEvent('dialog');
  await page.getByTestId('habit-input').click();
  await page.getByTestId('habit-input').fill('Habit kept after canceling reload');
  const attemptedReload = page.evaluate(() => window.location.reload());
  const dialog = await warning;
  expect(dialog.type()).toBe('beforeunload');
  await dialog.dismiss();
  await attemptedReload;
  expect((await saved).ok()).toBe(true);
  await expect(page.getByText('Synced', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('habit-input')).toHaveValue('Habit kept after canceling reload');
});

test('traits, habit, and body description can be edited', async ({ page, seededCharacter }) => {
  await page.goto(`/character/${seededCharacter.id}`);
  await expect(page.getByTestId('generate-new-button')).toBeVisible({ timeout: 30000 });

  await fillAndSave(page, 'trait1-input', 'Obsessive');
  await fillAndSave(page, 'trait2-input', 'Paranoid');
  await fillAndSave(page, 'habit-input', 'Bites nails');
  await fillAndSave(page, 'body-description-input', 'Tall and lanky');

  await page.reload();
  await expect(page.getByTestId('trait1-input')).toHaveValue('Obsessive');
  await expect(page.getByTestId('trait2-input')).toHaveValue('Paranoid');
  await expect(page.getByTestId('habit-input')).toHaveValue('Bites nails');
  await expect(page.getByTestId('body-description-input')).toHaveValue('Tall and lanky');
});

test('in-app navigation saves the pending habit before leaving the sheet', async ({ page, seededCharacter }) => {
  await page.goto(`/character/${seededCharacter.id}`);
  await fillAndSave(page, 'habit-input', 'Saved before navigation');
  const saved = page.waitForResponse((response) =>
    response.request().method() === 'PATCH' && response.url().includes(`/api/characters/${seededCharacter.id}`)
  );
  await page.getByTestId('habit-input').fill('Kept through immediate navigation');
  await page.getByRole('link', { name: 'Start', exact: true }).click();
  expect((await saved).ok()).toBe(true);
  await expect(page).toHaveURL(/\/$/);
  await page.goto(`/character/${seededCharacter.id}`);
  await expect(page.getByTestId('habit-input')).toHaveValue('Kept through immediate navigation');
  await page.getByRole('link', { name: 'Start', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  const unloadWarnings: string[] = [];
  page.on('dialog', async (dialog) => {
    unloadWarnings.push(dialog.type());
    await dialog.accept();
  });
  await page.reload();
  expect(unloadWarnings).toEqual([]);
  await expect(page).toHaveURL(/\/$/);
});

test('failed navigation saves keep the sheet available for Retry', async ({ page, seededCharacter }) => {
  await page.goto(`/character/${seededCharacter.id}`);
  await expect(page.getByTestId('habit-input')).toBeVisible();
  const patchRoute = `**/api/characters/${seededCharacter.id}*`;
  let attempts = 0;
  await page.route(patchRoute, async (route) => {
    if (route.request().method() !== 'PATCH') return route.continue();
    attempts++;
    await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ statusCode: 503, code: 'SERVICE_UNAVAILABLE', message: 'Unavailable' }) });
  });
  await page.getByTestId('habit-input').fill('Kept after navigation failure');
  await page.getByRole('link', { name: 'Start', exact: true }).click();
  await expect.poll(() => attempts).toBe(3);
  await expect(page).toHaveURL(new RegExp(`/character/${seededCharacter.id}$`));
  const skip = page.getByRole('button', { name: /skip/i });
  if (await skip.isVisible()) await skip.click();
  await page.unroute(patchRoute);
  const saved = page.waitForResponse((response) => response.request().method() === 'PATCH' && response.url().includes(`/api/characters/${seededCharacter.id}`));
  await page.getByRole('button', { name: 'Retry', exact: true }).first().click();
  expect((await saved).ok()).toBe(true);
  await page.getByRole('link', { name: 'Start', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto(`/character/${seededCharacter.id}`);
  await expect(page.getByTestId('habit-input')).toHaveValue('Kept after navigation failure');
});
