import { expect, test } from '../../fixtures.js';

for (const start of ['home', 'sheet'] as const) {
  test(`logout from ${start} lands on the public landing page, also after reload (RPG-320)`, async ({ page, seededCharacter }) => {
    await page.goto(start === 'home' ? '/' : `/character/${seededCharacter.id}`);
    await page.getByRole('button', { name: /log out/i }).click();

    await expect(page).toHaveURL(/\/\?logged-out=true$/);
    await expect(page.getByRole('link', { name: /log in/i })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('link', { name: /log in/i })).toBeVisible();
    await expect(page.getByTestId('character-sheet-skeleton')).not.toBeVisible();
    await expect(page.getByRole('heading', { name: /404|lost in the doom/i })).not.toBeVisible();
  });
}
