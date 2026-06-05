import { expect, test } from '../../fixtures.js';
import type { Page } from '@playwright/test';

function isCharacterPatch(url: string, characterId: string): boolean {
  const parsed = new URL(url);
  return parsed.pathname === `/api/characters/${characterId}`;
}

async function fillAndWaitForFailedPatch(
  page: Page,
  characterId: string,
  testId: string,
  value: string
) {
  const failedPatchPromise = page.waitForEvent(
    'requestfailed',
    {
      predicate: (request) =>
        request.method() === 'PATCH' && isCharacterPatch(request.url(), characterId),
      timeout: 30000,
    }
  );

  const input = page.getByTestId(testId);
  await input.fill(value);
  await input.blur();
  await failedPatchPromise;
}

async function fillAndWaitForPatchResponse(
  page: Page,
  characterId: string,
  testId: string,
  value: string,
  status: number
) {
  const patchResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'PATCH' &&
      isCharacterPatch(response.url(), characterId) &&
      response.status() === status,
    { timeout: 30000 }
  );

  const input = page.getByTestId(testId);
  await input.fill(value);
  await input.blur();
  await patchResponsePromise;
}


test('manual generate reports rate-limit errors without replacing the current character', async ({
  page,
  seededCharacter,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/api/characters/new**', async (route) => {
    await route.fulfill({
      status: 429,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'rate_limited' }),
    });
  });

  await page.goto(`/character/${seededCharacter.id}`);
  await expect(page.getByTestId('generate-new-button')).toBeVisible({ timeout: 30000 });

  await page.getByTestId('generate-new-button').click();
  await expect(page.getByText(/too many requests/i)).toBeVisible({ timeout: 30000 });
  await expect(page).toHaveURL(new RegExp(`/character/${seededCharacter.id}$`));
});

test('offline save failures surface retry UX after repeated failed sync attempts', async ({
  page,
  seededCharacter,
}) => {
  test.setTimeout(90000);

  await page.goto(`/character/${seededCharacter.id}`);
  await expect(page.getByTestId('generate-new-button')).toBeVisible({ timeout: 30000 });

  await page.route(`**/api/characters/${seededCharacter.id}**`, async (route) => {
    if (route.request().method() === 'PATCH') {
      await route.abort('internetdisconnected');
      return;
    }

    await route.continue();
  });

  await fillAndWaitForFailedPatch(page, seededCharacter.id, 'notes-input', 'offline failure 1');
  await fillAndWaitForFailedPatch(page, seededCharacter.id, 'notes-input', 'offline failure 2');
  await fillAndWaitForFailedPatch(page, seededCharacter.id, 'notes-input', 'offline failure 3');

  await expect(page.getByText(/connection failed/i)).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();
});

test('unexpected save errors can be reported via the feedback endpoint', async ({
  page,
  seededCharacter,
}) => {
  test.setTimeout(90000);

  const feedbackRequests: unknown[] = [];
  await page.route('**/api/feedback', async (route) => {
    if (route.request().method() === 'POST') {
      feedbackRequests.push(JSON.parse(route.request().postData() ?? '{}'));
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"eventId":"e2e-mock-event-id"}' });
      return;
    }
    await route.continue();
  });

  await page.goto(`/character/${seededCharacter.id}`);
  await expect(page.getByTestId('generate-new-button')).toBeVisible({ timeout: 30000 });

  await page.route(`**/api/characters/${seededCharacter.id}**`, async (route) => {
    if (route.request().method() === 'PATCH') {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Unexpected error occurred.',
          message: 'Unexpected error occurred.',
          code: 'INTERNAL_ERROR',
          statusCode: 500,
          requestId: 'e2e-request-id',
        }),
      });
      return;
    }
    await route.continue();
  });

  await fillAndWaitForPatchResponse(page, seededCharacter.id, 'notes-input', 'server error 1', 500);
  await fillAndWaitForPatchResponse(page, seededCharacter.id, 'notes-input', 'server error 2', 500);
  await fillAndWaitForPatchResponse(page, seededCharacter.id, 'notes-input', 'server error 3', 500);

  await expect(
    page.getByRole('dialog', { name: /unexpected error occurred/i })
  ).toBeVisible({ timeout: 30000 });

  await page
    .getByRole('textbox', { name: /what were you doing/i })
    .fill('I was saving notes when the API failed.');
  await page.getByRole('button', { name: /send report/i }).click();

  await expect(page.getByText(/report sent/i)).toBeVisible({ timeout: 30000 });

  expect(feedbackRequests.length).toBeGreaterThanOrEqual(1);
  expect(feedbackRequests[0]).toMatchObject({
    kind: 'error',
    message: 'I was saving notes when the API failed.',
  });
});
