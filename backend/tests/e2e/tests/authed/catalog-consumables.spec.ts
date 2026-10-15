import { expect, test } from '../../fixtures';
import { selectSearchResult } from '../utils/character-sheet.js';
import { waitForCharacterSave } from '../utils/save.js';

test('catalog Torches keep separate use controls for both copies after reload', async ({ page, seededCharacter }) => {
  await page.goto(`/character/${seededCharacter.id}`);
  await expect(page.getByText('Synced', { exact: true })).toBeVisible();
  await page.evaluate(async (id) => {
    const { token } = await (await fetch('/api/csrf-token')).json();
    const response = await fetch(`/api/characters/${id}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json', 'x-csrf-token': token },
      body: JSON.stringify({ equipment: [] }),
    });
    if (!response.ok) throw new Error(`Consumable setup failed: ${response.status}`);
  }, seededCharacter.id);
  await page.reload();
  for (const query of ['torch', 'torches']) {
    await waitForCharacterSave(page, () => selectSearchResult(page, query, /^Torches\b/i));
  }
  await page.reload();
  const consumables = page.getByRole('button', { name: 'Consumables', exact: true });
  await expect(consumables).toBeVisible();
  if (await consumables.getAttribute('aria-expanded') === 'false') {
    await consumables.click();
  }
  const firstUses = page.getByRole('button', { name: 'Mark used: Torches use 1', exact: true });
  await expect(firstUses).toHaveCount(2);
  await waitForCharacterSave(page, () => firstUses.first().click());
  await page.reload();
  const section = page.getByRole('button', { name: 'Consumables', exact: true });
  if (await section.getAttribute('aria-expanded') === 'false') {
    await section.click();
  }
  await expect(page.getByRole('button', { name: 'Mark unused: Torches use 1', exact: true })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Mark used: Torches use 1', exact: true })).toHaveCount(1);
  await expect(page.getByRole('button', { name: /^Mark (?:un)?used: Torches use \d+$/ })).toHaveCount(12);
});
