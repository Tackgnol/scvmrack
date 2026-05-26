import { expect, test } from '../../fixtures';
import { changeHpByOne, fillAndSave } from '../utils/character-sheet.js';

test('HP and silver can be edited and persists', async ({ page, seededCharacter }) => {
  await page.goto(`/character/${seededCharacter.id}`);
  await expect(page.getByTestId('generate-new-button')).toBeVisible({ timeout: 30000 });

  const hpTarget = await changeHpByOne(page);
  await fillAndSave(page, 'silver-input', '150');

  await page.reload();
  await expect(page.getByTestId('hp-input')).toHaveValue(hpTarget);
  await expect(page.getByTestId('silver-input')).toHaveValue('150');
});
