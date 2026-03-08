import { expect, test } from '@playwright/test';

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    localStorage.setItem(
      'scvmgrinder-privacy-settings-v1',
      JSON.stringify({ acknowledged: true, analyticsEnabled: false })
    );
  });
});

test.describe('Guest Editing', () => {
  test('Guest can edit character sheet entirely and it saves', async ({ page }) => {
    // 18+ steps each with a 1-second debounce flush — needs more than the default 30s
    test.setTimeout(60000);

    // Navigate directly and rely on UI state for readiness
    await page.goto('/');
    await expect(page.getByTestId('app-title')).toBeVisible({ timeout: 15000 });

    // Check it's an anonymous new guest by seeing if synced badge eventually appears
    const syncBadge = page.getByText('Synced', { exact: true });
    await expect(syncBadge).toBeVisible({ timeout: 20000 });

    // Step 1: Edit current Hit Points
    const hpInput = page.getByTestId('hp-input');
    await hpInput.fill('5');
    await hpInput.blur();
    await expect(syncBadge).toBeVisible(); // Saves

    // Step 2: Edit current Silver
    const silverInput = page.getByTestId('silver-input');
    await silverInput.fill('150');
    await silverInput.blur();
    await expect(syncBadge).toBeVisible();

    // Step 3: Add comments to abilities
    // Find the first comment text field among abilities. Note: this might not exist if class has no abilities.
    const firstCommentInput = page.getByTestId('ability-comment-0-input');
    if (await firstCommentInput.isVisible()) {
      await firstCommentInput.fill('My fun ability comment');
      await firstCommentInput.blur();
      await expect(syncBadge).toBeVisible();
    }

    // Step 4: Edit Trait 1
    const trait1Input = page.getByTestId('trait1-input');
    await trait1Input.fill('Obsessive');
    await trait1Input.blur();
    await expect(syncBadge).toBeVisible();

    // Step 5: Edit Trait 2
    const trait2Input = page.getByTestId('trait2-input');
    await trait2Input.fill('Paranoid');
    await trait2Input.blur();
    await expect(syncBadge).toBeVisible();

    // Step 6: Edit Habit
    const habitInput = page.getByTestId('habit-input');
    await habitInput.fill('Bites nails');
    await habitInput.blur();
    await expect(syncBadge).toBeVisible();

    // Step 7: Edit Body Description
    const bodyInput = page.getByTestId('body-description-input');
    await bodyInput.fill('Tall and lanky');
    await bodyInput.blur();
    await expect(syncBadge).toBeVisible();

    // Step 8: Add quick modifier
    const quickModInput = page.getByTestId('quick-mod-name-input');
    await quickModInput.fill('Quick Boost');
    const quickModValue = page.getByTestId('quick-mod-value-input');
    await quickModValue.click();
    await quickModValue.fill('1');
    await quickModValue.press('Enter');

    await expect(page.getByText('Quick Boost')).toBeVisible({ timeout: 20000 });
    await expect(syncBadge).toBeVisible();

    // Step 9: Add modifier via Modal
    const advancedModBtn = page.getByTestId('advanced-mod-btn');
    await advancedModBtn.click();
    const modModal = page.getByRole('dialog');
    await expect(modModal).toBeVisible();
    await page.getByTestId('modal-mod-name-input').fill('Modal Super Buff');
    await page.getByTestId('modal-mod-save-btn').click();
    await expect(modModal).not.toBeVisible();
    await expect(page.getByText('Modal Super Buff')).toBeVisible();
    await expect(syncBadge).toBeVisible();

    // Step 10: Add scroll to inventory
    const eqSearch = page.getByTestId('equipment-search-input');
    await eqSearch.fill('scroll'); // type "scroll"
    await page.waitForTimeout(500); // Wait for debounce/search
    await page.getByRole('option').first().click();
    await expect(syncBadge).toBeVisible();

    // Step 11: Add armor
    await eqSearch.fill('armor');
    await page.waitForTimeout(500);
    await page.getByRole('option').first().click();
    await expect(syncBadge).toBeVisible();

    // Step 12: Add weapon
    await eqSearch.fill('weapon');
    await page.waitForTimeout(500);
    await page.getByRole('option').first().click();
    await expect(syncBadge).toBeVisible();

    // Step 13-14: Equip/unequip weapon (inventory may or may not contain weapons)
    const weaponSlot = page.getByTestId('equipped-weapon-slot-0');
    await weaponSlot.click();
    const weaponOption = page.locator('[data-testid^="equip-weapon-option-"]').first();
    const hasWeaponToEquip = await weaponOption
      .waitFor({ state: 'visible', timeout: 3000 })
      .then(() => true)
      .catch(() => false);
    if (hasWeaponToEquip) {
      await weaponOption.click();
      await expect(syncBadge).toBeVisible();

      await weaponSlot.click();
      await page.getByTestId('unequip-weapon-option').click();
      await expect(syncBadge).toBeVisible();
    } else {
      await page.keyboard.press('Escape');
    }

    // Step 15-16: Equip/unequip armor (inventory may or may not contain armor)
    const armorSlot = page.getByTestId('equipped-armor-slot');
    await armorSlot.click();
    const armorOption = page.locator('[data-testid^="equip-armor-option-"]').first();
    const hasArmorToEquip = await armorOption
      .waitFor({ state: 'visible', timeout: 3000 })
      .then(() => true)
      .catch(() => false);
    if (hasArmorToEquip) {
      await armorOption.click();
      await expect(syncBadge).toBeVisible();

      await armorSlot.click();
      await page.getByTestId('unequip-armor-option').click();
      await expect(syncBadge).toBeVisible();
    } else {
      await page.keyboard.press('Escape');
    }

    // Step 17: Power usage dot clicked and saved
    const firstPip = page.getByTestId('power-pip').first();
    if (await firstPip.isVisible()) {
      await firstPip.click();
      await expect(syncBadge).toBeVisible();
    }

    // Step 18: Add a Note or Misery
    const notesInput = page.getByTestId('notes-input');
    await notesInput.fill('I am doomed');
    await notesInput.blur();
    await expect(syncBadge).toBeVisible();

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
    await expect(notesInput).toHaveValue('I am doomed');
  });
});
