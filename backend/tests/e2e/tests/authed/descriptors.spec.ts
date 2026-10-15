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
