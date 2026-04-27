import { expect, test } from '../../fixtures.js';
import { waitForCharacterSave } from '../utils/save.js';

test('ability comments can be edited', async ({ page, seededCharacter }) => {
  await page.goto(`/?character=${seededCharacter.id}`);
  await expect(page.getByTestId('generate-new-button')).toBeVisible({ timeout: 30000 });

  const firstCommentInput = page.getByTestId('ability-comment-0-input');
  if (await firstCommentInput.isVisible()) {
    await waitForCharacterSave(page, async () => {
      await firstCommentInput.fill('My fun ability comment');
      await firstCommentInput.blur();
    });
    await page.reload();
    await expect(firstCommentInput).toHaveValue('My fun ability comment');
  }
});
