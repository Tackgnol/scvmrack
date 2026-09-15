import { expect, test } from '../../fixtures';
import { fillAndSave } from '../utils/character-sheet.js';

test('anonymous OBR handoff keeps both browser contexts on the same character', async ({ page, browser }) => {
  test.setTimeout(60000);

  await page.goto('/character');
  await expect(page.getByTestId('generate-new-button')).toBeVisible({ timeout: 30000 });
  await expect(page).toHaveURL(/\/character\/[a-f0-9-]+/, { timeout: 30000 });
  const characterId = new URL(page.url()).pathname.split('/').at(-1);
  if (!characterId) throw new Error('Character URL has no id');

  const token = await page.evaluate(async () => {
    const response = await fetch('/api/auth/obr-exchange/issue', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    if (!response.ok) throw new Error(`Issue failed: ${response.status}`);
    return ((await response.json()) as { token: string }).token;
  });

  const tabContext = await browser.newContext();
  await tabContext.addInitScript(() => {
    localStorage.setItem(
      'scvmgrinder-privacy-settings-v1',
      JSON.stringify({ acknowledged: true, analyticsEnabled: false }),
    );
  });

  try {
    const tab = await tabContext.newPage();
    await tab.goto(`/obr-open?token=${encodeURIComponent(token)}&character=${characterId}`);
    await expect(tab).toHaveURL(`/character/${characterId}`, { timeout: 15000 });
    await expect(tab.getByTestId('generate-new-button')).toBeVisible({ timeout: 30000 });

    const note = `handoff-${crypto.randomUUID()}`;
    await fillAndSave(tab, 'notes-input', note);

    await page.reload();
    await expect(page.getByTestId('notes-input')).toHaveValue(note, { timeout: 30000 });
  } finally {
    await tabContext.close();
  }
});
