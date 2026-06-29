import {
  createSeededCharacter,
  createTestUser,
  expect,
  prepareActorContext,
  test,
} from '../../fixtures.js';

function isPath(url: string, re: RegExp): boolean {
  return re.test(new URL(url).pathname);
}

test('GM creates a party, sees the invite link, and regenerates it', async ({ page }) => {
  test.setTimeout(90000);

  await page.goto('/gm');
  await expect(page.getByRole('heading', { name: /party control/i })).toBeVisible({ timeout: 30000 });

  // Create a party; capture the 201 so we have the id + invite token deterministically.
  const createPromise = page.waitForResponse(
    (r) => r.request().method() === 'POST' && isPath(r.url(), /^\/api\/parties$/) && r.status() === 201,
    { timeout: 30000 }
  );
  await page.getByRole('textbox').first().fill('E2E Warband');
  await page.getByRole('button', { name: /create party/i }).click();
  const party = (await (await createPromise).json()) as { id: string; inviteToken: string };
  expect(party.id).toBeTruthy();
  expect(party.inviteToken).toBeTruthy();

  // Lands on the manage view.
  await expect(page).toHaveURL(new RegExp(`/party/${party.id}$`), { timeout: 30000 });
  await expect(page.getByRole('heading', { name: 'E2E Warband' })).toBeVisible({ timeout: 30000 });
  await expect(page.getByText(new RegExp(`/join/${party.inviteToken}`))).toBeVisible();

  // Regenerate the link -> a new token that differs from the original.
  const regenPromise = page.waitForResponse(
    (r) =>
      r.request().method() === 'POST' &&
      isPath(r.url(), new RegExp(`^/api/parties/${party.id}/regenerate-link$`)) &&
      r.status() === 200,
    { timeout: 30000 }
  );
  await page.getByRole('button', { name: /generate new link/i }).click();
  const regen = (await (await regenPromise).json()) as { inviteToken: string };
  expect(regen.inviteToken).not.toBe(party.inviteToken);
  await expect(page.getByText(new RegExp(`/join/${regen.inviteToken}`))).toBeVisible({ timeout: 15000 });
});

test('a player joins a party via the invite link and the GM sees the member', async ({
  page,
  browser,
}) => {
  test.setTimeout(120000);

  // GM creates a party.
  await page.goto('/gm');
  const createPromise = page.waitForResponse(
    (r) => r.request().method() === 'POST' && isPath(r.url(), /^\/api\/parties$/) && r.status() === 201,
    { timeout: 30000 }
  );
  await page.getByRole('textbox').first().fill('Join Target');
  await page.getByRole('button', { name: /create party/i }).click();
  const party = (await (await createPromise).json()) as { id: string; inviteToken: string };
  await expect(page).toHaveURL(new RegExp(`/party/${party.id}$`), { timeout: 30000 });

  // A second real player (their own account + an existing character) opens the
  // invite, picks that character, and joins. Deterministic: no auto-create
  // timing, and the context is privacy-acknowledged like the default fixture.
  const player = await createTestUser('E2E Joiner');
  const playerChar = await createSeededCharacter(player.userId, { name: 'Player Scvm' });
  const playerContext = await browser.newContext();
  await prepareActorContext(playerContext, player.sessionCookie);
  try {
    const playerPage = await playerContext.newPage();
    await playerPage.goto(`/join/${party.inviteToken}`);
    await expect(playerPage.getByText('Player Scvm')).toBeVisible({ timeout: 30000 });

    const joinPromise = playerPage.waitForResponse(
      (r) => r.request().method() === 'POST' && isPath(r.url(), /^\/api\/parties\/join$/) && r.status() === 200,
      { timeout: 30000 }
    );
    await playerPage.getByRole('button', { name: /join party/i }).click();
    await joinPromise;
    await expect(playerPage).toHaveURL(
      new RegExp(`/party/${party.id}/character/${playerChar.id}`),
      { timeout: 30000 }
    );
  } finally {
    await playerContext.close();
  }

  // Back on the GM manage view, the roster now shows the joined member.
  await page.goto(`/party/${party.id}`);
  await expect(page.getByText('Player Scvm')).toBeVisible({ timeout: 30000 });
});
