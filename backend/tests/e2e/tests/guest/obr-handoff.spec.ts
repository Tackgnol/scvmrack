import { expect, test } from '../../fixtures';
import { fillAndSave } from '../utils/character-sheet.js';

test('anonymous OBR handoff keeps both browser contexts on the same character', async ({ page, browser,
}) => {
  test.setTimeout(60000);

  await page.goto('/character');
  await expect(page.getByTestId('hp-input')).toBeVisible({ timeout: 30000 });
  await expect(page).toHaveURL(/\/character\/[a-f0-9-]+/, { timeout: 30000 });
  const characterId = new URL(page.url()).pathname.split('/').at(-1);
  if (!characterId) {
    throw new Error('Character URL has no id');
  }

  await page.goto(`/faq?contractCharacter=${characterId}`);
  await page.addScriptTag({
    type: 'module',
    url: '/test/contracts/transfer.tsx',
  });
  let openingLink: string | undefined;
  page.on('popup', (tab) =>
    tab.on('framenavigated', (frame) => {
      if (frame === tab.mainFrame() && frame.url().includes('/obr-open?')) {
        openingLink = frame.url();
      }
    })
  );
  const opened = page.waitForEvent('popup');
  await page
    .getByRole('button', { name: 'Open in scvmrack', exact: true })
    .click();
  const tab = await opened;
  const copiedContext = await browser.newContext();
  try {
    await expect(tab).toHaveURL(`/character/${characterId}`, {
      timeout: 15000,
    });
    await expect(tab.getByTestId('hp-input')).toBeVisible({ timeout: 30000 });
    await expect.poll(() => openingLink).toBeTruthy();
    expect(openingLink).not.toContain('token=');
    const copied = await copiedContext.newPage();
    await copied.goto(openingLink!);
    await expect(
      copied.getByText(
        'This opening link is unavailable. Open it again from Owlbear.',
        { exact: true }
      )
    ).toBeVisible();
    expect(
      await (await copied.request.get('/api/auth/get-session')).json()
    ).toBeNull();
    const note = `handoff-${crypto.randomUUID()}`;
    await fillAndSave(tab, 'notes-input', note);

    await page.goto(`/character/${characterId}`);
    await expect(page.getByTestId('notes-input')).toHaveValue(note, {
      timeout: 30000,
    });
  } finally {
    await copiedContext.close();
    await tab.close();
  }
});
