import { expect, Page } from '@playwright/test';

function isCharacterPatchResponse(url: string): boolean {
  return /\/characters\/[^/?]+(?:\?.*)?$/.test(url);
}

export async function waitForCharacterSave(
  page: Page,
  action: () => Promise<void>,
  timeout = 15000
): Promise<void> {
  const patchRequest = page.waitForRequest(
    (request) =>
      request.method() === 'PATCH' &&
      isCharacterPatchResponse(request.url()),
    { timeout }
  );

  await action();
  const request = await patchRequest;
  const response = await request.response();

  if (!response?.ok()) {
    throw new Error(
      `Character save failed for ${request.url()} with status ${response?.status() ?? 'no-response'}`
    );
  }

  await expect(page.getByTestId('synced-chip')).toBeVisible({ timeout });
}
