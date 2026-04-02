import { expect, Page } from '@playwright/test';
import { waitForCharacterSave } from './save.js';

async function fillAndSave(
  page: Page,
  testId: string,
  value: string,
  timeout = 20000
) {
  const input = page.getByTestId(testId);
  await waitForCharacterSave(page, async () => {
    await input.fill(value);
    await input.blur();
  }, timeout);
}

async function selectSearchResult(page: Page, query: string, optionName: string | RegExp) {
  const eqSearch = page.getByTestId('equipment-search-input');
  const option = page.getByRole('option', {
    name: typeof optionName === 'string' ? new RegExp(optionName, 'i') : optionName,
  });

  await eqSearch.click();
  await eqSearch.fill(query);
  await page.waitForTimeout(1000);
  await expect(option).toBeVisible({ timeout: 10000 });
  await option.click();
}

export async function runCharacterSheetEditingSteps(page: Page, syncBadgeTimeout = 20000) {
  // Check it's an anonymous new guest by seeing if synced badge eventually appears
  const syncBadge = page.getByText('Synced', { exact: true });
  await expect(syncBadge).toBeVisible({ timeout: syncBadgeTimeout });

  // Step 1: Edit current Hit Points
  await fillAndSave(page, 'hp-input', '5');

  // Step 2: Edit current Silver
  await fillAndSave(page, 'silver-input', '150');

  // Step 3: Add comments to abilities
  // Find the first comment text field among abilities. Note: this might not exist if class has no abilities.
  const firstCommentInput = page.getByTestId('ability-comment-0-input');
  if (await firstCommentInput.isVisible()) {
    await waitForCharacterSave(page, async () => {
      await firstCommentInput.fill('My fun ability comment');
      await firstCommentInput.blur();
    });
  }

  // Step 4: Edit Trait 1
  await fillAndSave(page, 'trait1-input', 'Obsessive');

  // Step 5: Edit Trait 2
  await fillAndSave(page, 'trait2-input', 'Paranoid');

  // Step 6: Edit Habit
  await fillAndSave(page, 'habit-input', 'Bites nails');

  // Step 7: Edit Body Description
  await fillAndSave(page, 'body-description-input', 'Tall and lanky');

  // Step 8: Add quick modifier
  const quickModInput = page.getByTestId('quick-mod-name-input');
  await quickModInput.fill('Quick Boost');
  const quickModValue = page.getByTestId('quick-mod-value-input');
  await waitForCharacterSave(page, async () => {
    await quickModValue.click();
    await quickModValue.fill('1');
    await quickModValue.press('Enter');
  });

  await expect(page.getByText('Quick Boost')).toBeVisible({ timeout: 20000 });

  // Step 9: Add modifier via Modal
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

  // Step 10: Add scroll to inventory
  await selectSearchResult(page, 'palms', /^Palms Open the Southern Gate\b/i);
  await expect(syncBadge).toBeVisible({ timeout: 20000 });

  // Step 11: Add armor
  await selectSearchResult(page, 'leather', /^Leather Armor\b/i);
  await expect(syncBadge).toBeVisible({ timeout: 20000 });

  // Step 12: Add weapon
  await selectSearchResult(page, 'sword', /^Sword\b/i);
  await expect(syncBadge).toBeVisible({ timeout: 20000 });

  // Step 13-14: Equip/unequip weapon (inventory may or may not contain weapons)
  const weaponSlot = page.getByTestId('equipped-weapon-slot-0');
  await weaponSlot.click();
  const weaponOption = page.locator('[data-testid^="equip-weapon-option-"]').filter({
    hasText: /^Sword(?:\s|$)/i,
  });
  const hasWeaponToEquip = await weaponOption
    .waitFor({ state: 'visible', timeout: 3000 })
    .then(() => true)
    .catch(() => false);
  if (hasWeaponToEquip) {
    await waitForCharacterSave(page, async () => {
      await weaponOption.click();
    });

    await weaponSlot.click();
    await waitForCharacterSave(page, async () => {
      await page.getByTestId('unequip-weapon-option').click();
    });
  } else {
    await page.keyboard.press('Escape');
  }

  // Step 15-16: Equip/unequip armor (inventory may or may not contain armor)
  const armorSlot = page.getByTestId('equipped-armor-slot');
  await armorSlot.click();
  const armorOption = page.locator('[data-testid^="equip-armor-option-"]').filter({
    hasText: /^Leather Armor(?:\s|$)/i,
  });
  const hasArmorToEquip = await armorOption
    .waitFor({ state: 'visible', timeout: 3000 })
    .then(() => true)
    .catch(() => false);
  if (hasArmorToEquip) {
    await waitForCharacterSave(page, async () => {
      await armorOption.click();
    });

    await armorSlot.click();
    await waitForCharacterSave(page, async () => {
      await page.getByTestId('unequip-armor-option').click();
    });
  } else {
    await page.keyboard.press('Escape');
  }

  // Step 17: Power usage dot clicked and saved
  const addedScrollPip = page.getByRole('button', { name: /Palms Open the Southern Gate use 1/i });
  if (await addedScrollPip.isVisible()) {
    await waitForCharacterSave(page, async () => {
      await addedScrollPip.click();
    });
  }

  // Step 18: Add a Note or Misery
  await fillAndSave(page, 'notes-input', 'I am doomed');

  // Step 19: Refresh and all values are still edited
  await page.reload();
  await expect(page.getByTestId('app-title')).toBeVisible({ timeout: 15000 });

  // Verify
  await expect(page.getByTestId('hp-input')).toHaveValue('5');
  await expect(page.getByTestId('silver-input')).toHaveValue('150');
  if (await firstCommentInput.isVisible()) {
    await expect(firstCommentInput).toHaveValue('My fun ability comment');
  }
  await expect(page.getByTestId('trait1-input')).toHaveValue('Obsessive');
  await expect(page.getByTestId('habit-input')).toHaveValue('Bites nails');
  await expect(page.getByText('Quick Boost')).toBeVisible();
  await expect(page.getByText('Modal Super Buff')).toBeVisible();
  await expect(page.getByTestId('notes-input')).toHaveValue('I am doomed');
}
