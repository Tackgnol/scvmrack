import { expect, test } from '../../fixtures';
import {
  expectMiseryCount,
  markMiseryAndSave,
} from '../utils/character-sheet.js';

test('signed-in player persists the misery track', async ({
  page,
  seededCharacter,
}) => {
  await page.goto(`/character/${seededCharacter.id}`);
  await expect(page.getByTestId('generate-new-button')).toBeVisible({
    timeout: 30000,
  });

  await markMiseryAndSave(page, 4);
  await expectMiseryCount(page, 4);

  await page.reload();
  await expectMiseryCount(page, 4);
});
