import { expect, test } from '../../fixtures';

test('authenticated user can cancel and confirm kill-and-replace flow', async ({
  page,
  seedCharacter,
}) => {
  test.setTimeout(90000);

  const target = await seedCharacter({ name: 'E2E Marked Scvm' });
  await page.emulateMedia({ reducedMotion: 'reduce' });

  await page.goto(`/character/${target.id}`);
  await expect(page.getByTestId('generate-new-button')).toBeVisible({ timeout: 30000 });

  await page.getByTestId('kill-scvm-button').click();
  const dialog = page.getByRole('dialog', { name: /kill this scvm/i });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('E2E Marked Scvm');

  await dialog.getByRole('button', { name: /cancel/i }).click();
  await expect(dialog).not.toBeVisible();

  await page.getByTestId('kill-scvm-button').click();
  await expect(dialog).toBeVisible();

  const deleteResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'DELETE' &&
      new URL(response.url()).pathname === `/api/characters/${target.id}`,
    { timeout: 30000 }
  );
  const createResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname === '/api/characters/new' &&
      response.status() === 201,
    { timeout: 30000 }
  );

  await page.getByTestId('kill-confirm-button').click();
  expect((await deleteResponsePromise).status()).toBe(204);
  const created = (await (await createResponsePromise).json()) as { id?: string };
  const createdId = created.id;
  expect(createdId).toBeTruthy();
  if (!createdId) {
    throw new Error('Kill-and-replace did not return a replacement character id');
  }

  await expect(page.getByTestId('generate-new-button')).toBeVisible({ timeout: 30000 });
  await page.goto('/characters');
  await expect(page.getByTestId(`character-row-${target.id}`)).toHaveCount(0);
  await expect(page.getByTestId(`character-row-${createdId}`)).toBeVisible({ timeout: 30000 });
});
