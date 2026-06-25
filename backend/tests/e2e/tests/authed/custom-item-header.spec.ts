import { expect, test } from '../../fixtures.js';
import { waitForCharacterSave } from '../utils/save.js';

test('custom weapon preview can be forged, equipped from quick menu, and spend ammo', async ({
  page,
  seededCharacter,
}) => {
  test.setTimeout(90000);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`/character/${seededCharacter.id}`);
  await expect(page.getByTestId('generate-new-button')).toBeVisible({ timeout: 30000 });

  await page.getByRole('button', { name: /forge a custom item/i }).click();
  const dialog = page.getByRole('dialog', { name: /forge an item/i });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/name the item/i)).toBeVisible();

  await dialog.getByRole('radio', { name: /weapon/i }).click();
  await dialog.getByRole('textbox', { name: /item name/i }).fill('E2E Bone Bow');
  await dialog.getByRole('combobox', { name: /ammo type/i }).fill('E2E Bolt');
  await dialog.getByRole('spinbutton', { name: /add ammo/i }).fill('10');
  await expect(dialog.getByText('E2E Bone Bow')).toBeVisible();
  await expect(dialog.getByText(/\+ 10.*E2E Bolt/i)).toBeVisible();

  await waitForCharacterSave(page, async () => {
    await dialog.getByRole('button', { name: /^forge$/i }).click();
  }, 30000);
  await expect(page.getByText('E2E Bone Bow')).toBeVisible({ timeout: 30000 });

  await page.getByTestId('equipped-weapon-slot-0').click();
  const weaponOption = page.locator('[data-testid^="equip-weapon-option-"]').filter({
    hasText: /^E2E Bone Bow(?:\s|$)/i,
  });
  await expect(weaponOption).toBeVisible({ timeout: 10000 });
  await waitForCharacterSave(page, async () => {
    await weaponOption.click();
  }, 30000);

  await expect(page.getByTestId('equipped-weapon-slot-0')).toContainText('E2E Bone Bow');
  await expect(page.getByTestId('equipped-weapon-slot-0-ammo')).toHaveText('10');

  await waitForCharacterSave(page, async () => {
    await page.getByTestId('equipped-weapon-slot-0-ammo').click();
  }, 30000);
  await expect(page.getByTestId('equipped-weapon-slot-0-ammo')).toHaveText('9');
});

test('mobile header drawer exposes authenticated navigation and print action', async ({
  page,
  seededCharacter,
}) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto(`/character/${seededCharacter.id}`);
  await expect(page.getByTestId('generate-new-button')).toBeVisible({ timeout: 30000 });

  await page.getByRole('button', { name: /open menu/i }).click();
  await expect(page.getByText(/the vault/i)).toBeVisible();
  await expect(page.getByTestId('drawer-print-button')).toBeVisible();

  await page.getByTestId('nav-link-characters').click();
  await expect(page).toHaveURL(/\/characters$/);
  await expect(page.getByRole('heading', { name: /your characters/i })).toBeVisible({
    timeout: 30000,
  });
});
