import {
  customClassDraft,
  localized,
  offerPrivateClass,
  holdPartyRead,
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

for (const kind of ['Book', 'private Custom'] as const) {
  test(`additional ${kind} party forges open editable sheets without reloading (RPG-342)`, async ({ page, browser }) => {
    test.setTimeout(120000);
    await page.goto('/gm');
    const { token } = await (await page.request.get('/api/csrf-token')).json();
    const headers = { 'x-csrf-token': token };
    const created = await page.request.post('/api/parties', { headers, data: { name: `${kind} forge table` } });
    expect(created.status()).toBe(201);
    const party = await created.json();
    let className = 'Fanged Deserter';
    if (kind === 'private Custom') {
      await offerPrivateClass(page, party.id, customClassDraft({
        name: localized('E2E Forge Keeper'), description: localized('Keeps every new scvm.'),
        origins: [localized('The forge')], abilities: [],
      }));
      className = 'E2E Forge Keeper';
    }
    const player = await createTestUser('E2E Repeated Forger');
    const original = await createSeededCharacter(player.userId, { name: 'Original scvm' });
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    await prepareActorContext(context, player.sessionCookie);
    let releaseMembership = () => {};
    try {
      const sheet = await context.newPage();
      await sheet.goto(`/join/${party.inviteToken}`);
      await sheet.getByRole('button', { name: 'Join party', exact: true }).click();
      await expect(sheet.getByTestId('hp-input')).toBeVisible();
      const ids = [original.id];
      for (const ordinal of [2, 3]) {
        // The third forge receives a real pre-create snapshot after creation.
        const delayedRead = ordinal === 3 ? await holdPartyRead(sheet, party.id) : null;
        releaseMembership = delayedRead?.release ?? (() => {});
        await sheet.goto(`/join/${party.inviteToken}/forge`);
        await delayedRead?.ready;
        await sheet.getByRole('button', { name: new RegExp(`^${className} `) }).click();
        await sheet.getByRole('textbox', { name: 'Character name', exact: true }).fill(`Forged scvm ${ordinal}`);
        const documentStart = await sheet.evaluate(() => performance.timeOrigin);
        const confirmed = sheet.waitForResponse(response =>
          response.request().method() === 'POST' && isPath(response.url(), /^\/api\/characters\/new$/));
        await sheet.getByRole('button', { name: 'Create this wretch', exact: true }).click();
        const response = await confirmed;
        expect(response.status()).toBe(201);
        const character = await response.json();
        releaseMembership();
        ids.push(character.id);
        await expect(sheet).toHaveURL(new RegExp(`/party/${party.id}/character/${character.id}$`));
        await expect(sheet.getByTestId('hp-input')).toBeVisible();
        await expect(sheet.getByTestId('hp-input')).toBeEnabled();
        expect(await sheet.evaluate(() => performance.timeOrigin)).toBe(documentStart);
      }
      const persisted = await (await page.request.get(`/api/parties/${party.id}`)).json();
      expect(persisted.members.map((member: { characterId: string }) => member.characterId).sort()).toEqual(ids.sort());
    } finally {
      releaseMembership();
      await context.close();
    }
  });
}

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
  const playerContext = await browser.newContext({ storageState: { cookies: [], origins: [] } });
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
