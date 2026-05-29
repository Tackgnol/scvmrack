import { expect, test } from '../../fixtures.js';

function characterNewResponse(url: string): boolean {
  return /\/api\/characters\/new(?:\?.*)?$/.test(new URL(url).pathname + new URL(url).search);
}

test('authenticated user can list, create, open, and delete characters', async ({
  page,
  seedCharacter,
}) => {
  test.setTimeout(90000);

  const keep = await seedCharacter({ name: 'E2E List Keeper' });
  const doomed = await seedCharacter({ name: 'E2E List Doomed' });

  await page.goto('/characters');
  await expect(page.getByRole('heading', { name: /your characters/i })).toBeVisible();
  await expect(page.getByTestId(`character-row-${keep.id}`)).toContainText('E2E List Keeper');
  await expect(page.getByTestId(`character-row-${doomed.id}`)).toContainText('E2E List Doomed');

  await page.getByTestId(`open-character-${keep.id}`).click();
  await expect(page).toHaveURL(new RegExp(`/character/${keep.id}$`));
  await expect(page.getByTestId('generate-new-button')).toBeVisible({ timeout: 30000 });

  await page.goto('/characters');
  const createResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      characterNewResponse(response.url()) &&
      response.status() === 201,
    { timeout: 30000 }
  );
  await page.getByRole('button', { name: /generate new/i }).click();
  const createResponse = await createResponsePromise;
  const created = (await createResponse.json()) as { id?: string };
  const createdId = created.id;
  expect(createdId).toBeTruthy();
  if (!createdId) {
    throw new Error('Generate New did not return a character id');
  }
  await expect(page).toHaveURL(new RegExp(`/character/${createdId}$`), { timeout: 30000 });

  await page.goto('/characters');
  await expect(page.getByTestId(`character-row-${createdId}`)).toBeVisible({ timeout: 30000 });

  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain('E2E List Doomed');
    await dialog.accept();
  });
  const deleteResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'DELETE' &&
      new URL(response.url()).pathname === `/api/characters/${doomed.id}`,
    { timeout: 30000 }
  );
  await page.getByTestId(`delete-character-${doomed.id}`).click();
  await expect
    .poll(async () => (await deleteResponsePromise).status(), { timeout: 30000 })
    .toBe(204);
  await expect(page.getByTestId(`character-row-${doomed.id}`)).toHaveCount(0);
});

test('authenticated characters list keeps the row and reports delete failures', async ({
  page,
  seedCharacter,
}) => {
  const target = await seedCharacter({ name: 'E2E Delete Failure' });

  await page.goto('/characters');
  await expect(page.getByTestId(`character-row-${target.id}`)).toBeVisible({ timeout: 30000 });

  await page.route(`**/api/characters/${target.id}`, async (route) => {
    if (route.request().method() === 'DELETE') {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'delete_failed' }),
      });
      return;
    }

    await route.continue();
  });

  page.once('dialog', async (dialog) => {
    await dialog.accept();
  });
  await page.getByTestId(`delete-character-${target.id}`).click();
  await expect(page.getByText(/failed to delete character/i)).toBeVisible({ timeout: 30000 });
  await expect(page.getByTestId(`character-row-${target.id}`)).toBeVisible();
});
