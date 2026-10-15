import { expect, test } from '../../fixtures';

test('Polish sheet controls announce Polish actions and restore dialog focus', async ({ page, seededCharacter }) => {
  await page.goto(`/character/${seededCharacter.id}`);
  await expect(page.getByText('Synced', { exact: true })).toBeVisible();
  await page.evaluate(async (id) => {
    const { token } = await (await fetch('/api/csrf-token')).json();
    const response = await fetch(`/api/characters/${id}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json', 'x-csrf-token': token },
      body: JSON.stringify({
        equipment: [{ name: 'Jastrząb testowy', tags: ['pet'], uses: [false, true], dice: [4] }],
        equippedArmor: { name: 'Pancerz testowy', currentTier: 1, maxTier: 3 },
      }),
    });
    if (!response.ok) throw new Error(`Polish sheet setup failed: ${response.status}`);
  }, seededCharacter.id);
  await page.reload();
  await page.getByRole('button', { name: 'Polski', exact: true }).click();
  for (const stat of ['Zwinność', 'Opanowanie', 'Siła', 'Wytrzymałość']) {
    await expect(page.getByRole('button', { name: `Zmniejsz ${stat}`, exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: `Zwiększ ${stat}`, exact: true })).toBeVisible();
  }
  await expect(page.getByRole('button', { name: 'Obniż poziom pancerza' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Podnieś poziom pancerza' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Zaznacz punkt życia jako pełny: Jastrząb testowy, punkt 1' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Zaznacz punkt życia jako pusty: Jastrząb testowy, punkt 2' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Otwórz wyszukiwanie przedmiotów' })).toBeVisible();

  const forge = page.getByRole('button', { name: 'Stwórz własny przedmiot', exact: true });
  await forge.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: 'Zamknij okno' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(forge).toBeFocused();
});
