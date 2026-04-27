import { expect, test } from '../../fixtures';
import { fillAndSave } from '../utils/character-sheet.js';

test('notes and misery can be edited and persists', async ({ page, seededCharacter }) => {
  await page.goto(`/?character=${seededCharacter.id}`);
  await expect(page.getByTestId('generate-new-button')).toBeVisible({ timeout: 30000 });

  await fillAndSave(page, 'notes-input', 'I am doomed');

  await page.reload();
  await expect(page.getByTestId('notes-input')).toHaveValue('I am doomed');
});
