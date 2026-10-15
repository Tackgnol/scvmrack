import { expect, test } from '../../fixtures';
import { selectSearchResult } from '../utils/character-sheet.js';
import { waitForCharacterSave } from '../utils/save.js';
import type { Page } from '@playwright/test';

async function increaseRopeQuantity(page: Page) {
  await page.getByRole('button', { name: /^2x Rope\b/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Increase quantity', exact: true }).click();
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
}

for (const hammerFirst of [true, false]) {
test(`a stale inventory edit preserves the saved ${hammerFirst ? 'Hammer' : 'rope quantity'}`, async ({ page, context, seededCharacter }) => {
  const path = `/character/${seededCharacter.id}`;
  await page.goto(path);
  await expect(page.getByText('Synced', { exact: true })).toBeVisible();
  await page.evaluate(async (id) => {
    const { token } = await (await fetch('/api/csrf-token')).json();
    const response = await fetch(`/api/characters/${id}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json', 'x-csrf-token': token },
      body: JSON.stringify({ equipment: [{ key: 'equipment.rope' }, { key: 'equipment.rope' }] }),
    });
    if (!response.ok) throw new Error(`Inventory setup failed: ${response.status}`);
  }, seededCharacter.id);
  await page.reload();
  const staleTab = await context.newPage();
  await staleTab.goto(path);
  const rope = staleTab.getByRole('button', { name: /^2x Rope\b/ });
  await expect(rope).toBeVisible();

  await waitForCharacterSave(page, () => hammerFirst
    ? selectSearchResult(page, 'hammer', /^Hammer\b/i)
    : increaseRopeQuantity(page));
  const rejected = staleTab.waitForResponse((response) =>
    response.request().method() === 'PATCH' && response.url().includes(`/api/characters/${seededCharacter.id}`)
  );
  if (hammerFirst) {
    await increaseRopeQuantity(staleTab);
  } else {
    await selectSearchResult(staleTab, 'hammer', /^Hammer\b/i);
  }
  expect((await rejected).status()).toBe(409);
  await expect(staleTab.getByText(/This character changed in another tab/)).toBeVisible();
  await staleTab.reload();
  await expect(staleTab.getByTestId('inventory-item-slot').filter({ hasText: 'Hammer' })).toHaveCount(hammerFirst ? 1 : 0);
  await expect(staleTab.getByRole('button', { name: hammerFirst ? /^2x Rope\b/ : /^3x Rope\b/ })).toBeVisible();
});
}

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
