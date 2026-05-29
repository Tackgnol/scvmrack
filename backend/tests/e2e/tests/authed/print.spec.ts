import { expect, test } from '../../fixtures';

test('print page redirects from remembered character, renders sheet data, prints, and returns', async ({
  page,
  seedCharacter,
}) => {
  const character = await seedCharacter({ name: 'E2E Printable Wretch' });

  await page.addInitScript(() => {
    (window as unknown as { __printCalls: number }).__printCalls = 0;
    window.print = () => {
      (window as unknown as { __printCalls: number }).__printCalls += 1;
    };
  });

  await page.goto(`/character/${character.id}`);
  await expect(page.getByTestId('generate-new-button')).toBeVisible({ timeout: 30000 });
  await page.evaluate((characterId) => {
    localStorage.setItem('last-character-id', characterId);
  }, character.id);

  await page.goto('/print');
  await expect(page).toHaveURL(new RegExp(`/print\\?character=${character.id}$`), {
    timeout: 30000,
  });
  await expect(page.getByRole('heading', { name: /e2e printable wretch/i })).toBeVisible({
    timeout: 30000,
  });
  await expect
    .poll(() => page.evaluate(() => document.body.classList.contains('print-route-active')))
    .toBe(true);

  await page.locator('.print-toolbar').getByRole('button', { name: /print sheet/i }).click();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __printCalls?: number }).__printCalls ?? 0))
    .toBe(1);

  await page.locator('.print-toolbar').getByRole('button', { name: /^sheet$/i }).click();
  await expect(page).toHaveURL(new RegExp(`/character/${character.id}$`), { timeout: 30000 });
  await expect
    .poll(() => page.evaluate(() => document.body.classList.contains('print-route-active')))
    .toBe(false);
});
