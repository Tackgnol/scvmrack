import { expect, test } from '../../fixtures';
import {
  expectMiseryCount,
  markMiseryAndSave,
} from '../utils/character-sheet.js';

test('guest advances and rewinds the misery track', async ({ page }) => {
  await page.goto('/character');
  await expect(page.getByTestId('generate-new-button')).toBeVisible({
    timeout: 30000,
  });

  await markMiseryAndSave(page, 4);
  await expectMiseryCount(page, 4);

  await markMiseryAndSave(page, 4);
  await expectMiseryCount(page, 3);

  await page.reload();
  await expectMiseryCount(page, 3);
});
