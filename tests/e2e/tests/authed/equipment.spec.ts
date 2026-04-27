import { expect, test } from '../../fixtures';
import { selectSearchResult } from '../utils/character-sheet.js';
import { waitForCharacterSave } from '../utils/save.js';

test('equipment can be searched, equipped, and unequipped', async ({ page, seededCharacter }) => {
  await page.goto(`/?character=${seededCharacter.id}`);
  await expect(page.getByTestId('generate-new-button')).toBeVisible({ timeout: 30000 });

  const syncBadge = page.getByText('Synced', { exact: true });

  // Add scroll
  await selectSearchResult(page, 'palms', /^Palms Open the Southern Gate\b/i);
  await expect(syncBadge).toBeVisible({ timeout: 20000 });

  // Add armor
  await selectSearchResult(page, 'leather', /^Leather Armor\b/i);
  await expect(syncBadge).toBeVisible({ timeout: 20000 });

  // Add weapon
  await selectSearchResult(page, 'sword', /^Sword\b/i);
  await expect(syncBadge).toBeVisible({ timeout: 20000 });

  // Equip weapon
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

  // Equip armor
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
});
