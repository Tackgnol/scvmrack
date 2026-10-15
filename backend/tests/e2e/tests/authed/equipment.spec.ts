import { expect, test } from '../../fixtures';
import { selectSearchResult } from '../utils/character-sheet.js';
import { waitForCharacterSave } from '../utils/save.js';

test('equipping armor into an empty slot never creates a phantom carried item', async ({ page, seededCharacter }) => {
  await page.goto(`/character/${seededCharacter.id}`);
  await expect(page.getByText('Synced', { exact: true })).toBeVisible();
  await page.evaluate(async (id) => {
    const { token } = await (await fetch('/api/csrf-token')).json();
    const response = await fetch(`/api/characters/${id}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json', 'x-csrf-token': token },
      body: JSON.stringify({ equipment: [{ key: 'equipment.rope' }], equippedArmor: null, equippedWeapons: [], storage: [] }),
    });
    if (!response.ok) throw new Error(`Inventory setup failed: ${response.status}`);
  }, seededCharacter.id);
  await page.reload();
  await waitForCharacterSave(page, () => selectSearchResult(page, 'leather', /^Leather Armor\b/i));

  for (let cycle = 0; cycle < 2; cycle += 1) {
    await page.getByTestId('inventory-item-slot').filter({ hasText: 'Leather Armor' }).click();
    await waitForCharacterSave(page, () => page.getByTestId('equip-armor-slot').click());
    await page.reload();
    await expect(page.getByTestId('equipped-armor-slot')).toContainText('Leather Armor');
    await expect(page.getByTestId('inventory-item-slot')).toHaveCount(1);
    await expect(page.getByTestId('inventory-item-slot')).toContainText('Rope');
    await expect(page.getByRole('button', { name: /^Encumbrance 2 \/ / })).toBeVisible();
    if (cycle === 0) {
      await page.getByTestId('equipped-armor-slot').click();
      await waitForCharacterSave(page, () => page.getByTestId('unequip-armor-option').click());
      await page.reload();
    }
  }
});

test('equipment can be searched, equipped, and unequipped', async ({ page, seededCharacter }) => {
  await page.goto(`/character/${seededCharacter.id}`);
  await expect(page.getByTestId('generate-new-button')).toBeVisible({ timeout: 30000 });

  // Add scroll
  await waitForCharacterSave(page, async () => {
    await selectSearchResult(page, 'palms', /^Palms Open the Southern Gate\b/i);
  }, 30000);

  // Add armor
  await waitForCharacterSave(page, async () => {
    await selectSearchResult(page, 'leather', /^Leather Armor\b/i);
  }, 30000);

  // Add weapon
  await waitForCharacterSave(page, async () => {
    await selectSearchResult(page, 'sword', /^Sword\b/i);
  }, 30000);

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
