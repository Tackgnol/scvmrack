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

async function installFeedbackCaptureMock(page: Page) {
  await page.addInitScript(() => {
    type CaptureEvent =
      | {
          type: 'scope';
          contexts: Record<string, unknown>;
          tags: Record<string, string>;
        }
      | {
          type: 'exception';
          status?: number;
          code?: string;
          message: string;
        }
      | {
          type: 'feedback';
          payload: Record<string, unknown>;
          options: Record<string, unknown>;
        };

    const events: CaptureEvent[] = [];
    const target = window as Window & {
      __SCVMRACK_FEEDBACK_CAPTURE_EVENTS__?: CaptureEvent[];
      __SCVMRACK_FEEDBACK_CAPTURE__?: unknown;
    };

    target.__SCVMRACK_FEEDBACK_CAPTURE_EVENTS__ = events;
    target.__SCVMRACK_FEEDBACK_CAPTURE__ = {
      withScope(callback: (scope: {
        setContext: (name: string, context: Record<string, unknown>) => void;
        setTag: (name: string, value: string) => void;
      }) => void) {
        const contexts: Record<string, unknown> = {};
        const tags: Record<string, string> = {};
        callback({
          setContext: (name, context) => {
            contexts[name] = context;
          },
          setTag: (name, value) => {
            tags[name] = value;
          },
        });
        events.push({ type: 'scope', contexts, tags });
      },
      captureException(error: unknown) {
        const value = (error ?? {}) as {
          status?: number;
          statusCode?: number;
          code?: string;
          message?: string;
          error?: string;
        };
        events.push({
          type: 'exception',
          status: value.status ?? value.statusCode,
          code: value.code,
          message: value.message ?? value.error ?? String(error),
        });
        return 'e2e-error-event-id';
      },
      captureFeedback(
        payload: Record<string, unknown>,
        options: Record<string, unknown>
      ) {
        events.push({ type: 'feedback', payload, options });
        return 'e2e-feedback-event-id';
      },
    };
  });
}

async function feedbackCaptureEvents(page: Page) {
  return page.evaluate(
    () =>
      (window as Window & {
        __SCVMRACK_FEEDBACK_CAPTURE_EVENTS__?: unknown[];
      }).__SCVMRACK_FEEDBACK_CAPTURE_EVENTS__ ?? []
  );
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

  await expect(page.getByText(/failed to save changes/i)).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();
});

test('unexpected save errors can be reported through mocked frontend capture', async ({
  page,
  seededCharacter,
}) => {
  test.setTimeout(90000);

  await installFeedbackCaptureMock(page);
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

  const events = await feedbackCaptureEvents(page);
  expect(events).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: 'exception',
        status: 500,
        code: 'INTERNAL_ERROR',
        message: 'Unexpected error occurred.',
      }),
      expect.objectContaining({
        type: 'feedback',
        payload: expect.objectContaining({
          message: 'I was saving notes when the API failed.',
          source: 'unexpected_error_dialog',
          associatedEventId: 'e2e-error-event-id',
          tags: expect.objectContaining({
            feedback_kind: 'error',
            feedback_source: 'character_save',
            http_status: '500',
            api_code: 'INTERNAL_ERROR',
          }),
        }),
        options: { includeReplay: true },
      }),
    ])
  );
});
