import { expect, test } from '../../fixtures';
import { waitForCharacterSave } from '../utils/save.js';

test('quick modifier and advanced modal modifier can be added', async ({ page, seededCharacter }) => {
  await page.goto(`/character/${seededCharacter.id}`);
  await expect(page.getByTestId('generate-new-button')).toBeVisible({ timeout: 30000 });

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

  // Add modifier via Modal
  const advancedModBtn = page.getByTestId('advanced-mod-btn');
  await advancedModBtn.click();
  const modModal = page.getByRole('dialog');
  await expect(modModal).toBeVisible();
  await page.getByTestId('modal-mod-name-input').fill('Modal Super Buff');
  await waitForCharacterSave(page, async () => {
    await page.getByTestId('modal-mod-save-btn').click();
  });
  await expect(modModal).not.toBeVisible();
  await expect(page.getByText('Modal Super Buff')).toBeVisible();
});
