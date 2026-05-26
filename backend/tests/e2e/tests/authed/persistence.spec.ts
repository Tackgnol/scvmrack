import { expect, test } from '../../fixtures';
import { Page } from '@playwright/test';
import { fillAndSave } from '../utils/character-sheet.js';
import { waitForCharacterSave as waitForCharacterPatch } from '../utils/save.js';

test('all edits persist after page reload', async ({ page, seededCharacter }) => {
  test.setTimeout(90000);

  await page.goto(`/character/${seededCharacter.id}`);
  await expect(page.getByTestId('generate-new-button')).toBeVisible({ timeout: 30000 });

  // Wait for initial sync
  const syncBadge = page.getByText('Synced', { exact: true });
  await expect(syncBadge).toBeVisible({ timeout: 20000 });

  // Edit HP and silver
  await fillAndSave(page, 'hp-input', '5');
  await fillAndSave(page, 'silver-input', '150');

  // Edit trait and habit
  await fillAndSave(page, 'trait1-input', 'Obsessive');
  await fillAndSave(page, 'habit-input', 'Bites nails');

  // Add quick modifier
  const quickModInput = page.getByTestId('quick-mod-name-input');
  await quickModInput.fill('Quick Boost');
  const quickModValue = page.getByTestId('quick-mod-value-input');
  await waitForCharacterSave(page, async () => {
    await quickModValue.click();
    await quickModValue.fill('1');
    await quickModValue.press('Enter');
  });
  await expect(page.getByText('Quick Boost')).toBeVisible({ timeout: 20000 });

  // Add notes
  await fillAndSave(page, 'notes-input', 'I am doomed');

  // Reload and verify all edits persisted
  await page.reload();
  await expect(page.getByTestId('app-title')).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId('hp-input')).toHaveValue('5');
  await expect(page.getByTestId('silver-input')).toHaveValue('150');
  await expect(page.getByTestId('trait1-input')).toHaveValue('Obsessive');
  await expect(page.getByTestId('habit-input')).toHaveValue('Bites nails');
  await expect(page.getByText('Quick Boost')).toBeVisible();
  await expect(page.getByTestId('notes-input')).toHaveValue('I am doomed');
});

async function waitForCharacterSave(page: Page, fn: () => Promise<void>, timeout = 20000) {
  return waitForCharacterPatch(page, fn, timeout);
}
