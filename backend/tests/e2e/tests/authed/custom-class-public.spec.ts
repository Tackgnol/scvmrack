import { createTestUser, expect, prepareActorContext, test } from '../../fixtures.js';

const localized = (en: string) => ({ en, pl: '' });

const draft = {
  languages: ['en'],
  name: localized('E2E Gutter Prophet'),
  description: localized('Hears the Basilisks whisper through the drains.'),
  stats: Object.fromEntries(
    ['strength', 'agility', 'presence', 'toughness'].map((stat) => [
      stat,
      { count: 3, faces: 6, modifier: 0, dropLowest: false },
    ])
  ),
  hpDie: 8,
  omenDie: 2,
  weaponDie: 10,
  armorDie: 4,
  silver: { count: 2, faces: 6, multiplier: 10 },
  origins: [localized('A drowned chapel under Galgenbeck')],
  abilities: [
    {
      random: false,
      name: localized('Drain Sight'),
      text: localized('You can see through any grate within 10 metres.'),
      modifiers: [],
      grantItem: null,
      grantPet: null,
      table: null,
    },
  ],
  randomAbilityCount: 0,
  items: [],
  gettingBetterRule: 'book',
  gettingBetterNote: localized(''),
};

test('a published class page renders when opened directly by a signed-out visitor', async ({ page, browser }) => {
  test.setTimeout(90000);
  await page.goto('/gm/classes');

  const { token } = (await (await page.request.get('/api/csrf-token')).json()) as { token: string };
  const headers = { 'x-csrf-token': token };
  const created = await page.request.post('/api/classes', { headers, data: { draft } });
  expect(created.status()).toBe(201);
  const { id } = (await created.json()) as { id: number };
  const published = await page.request.post(`/api/classes/${id}/publish`, { headers, data: { confirmed: true } });
  expect(published.status()).toBe(200);

  // a hard load is what used to hang: the session settling wiped the in-flight detail query
  const guest = await browser.newContext();
  const guestPage = await guest.newPage();
  await guestPage.goto(`/classes/${id}`);
  await expect(guestPage.getByRole('heading', { name: 'E2E Gutter Prophet' })).toBeVisible({ timeout: 30000 });
  await guestPage.reload();
  await expect(guestPage.getByRole('heading', { name: 'E2E Gutter Prophet' })).toBeVisible({ timeout: 30000 });
  await guest.close();
});

const navigationDraft = {
  ...draft,
  name: localized('E2E Navigation Keeper'),
  hpDie: 12,
  abilities: [{ ...draft.abilities[0], grantItem: 'new:hook' }],
  items: [{
    ref: 'new:hook', type: 'weapon', name: localized('Navigation Hook'),
    description: localized('A hook forged for the navigation keeper.'), value: 0,
    weapon: { diceCount: 1, diceFaces: 6, damageModifier: 0, reach: 'melee', ammo: 'none', ammoCount: 10, ammoName: '', modifiers: [] },
    armor: { tier: 1, modifiers: [] },
    gear: { kind: 'carried', uses: 0, effect: 'text', effectDie: 6, statuses: [] },
    pet: { hp: 4, actionDie: 4, action: 'attack', humanoid: false, buffs: [] },
  }],
};

test('Resume and Edit load selected saved class content through in-app navigation', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('/gm');
  const { token } = await (await page.request.get('/api/csrf-token')).json();
  const headers = { 'x-csrf-token': token };
  const saved = await page.request.post('/api/classes', { headers, data: { draft: navigationDraft } });
  expect(saved.status()).toBe(201);
  const { id } = await saved.json();
  const stored = await page.request.post('/api/classes/drafts', { headers, data: { classId: null, draft: navigationDraft } });
  expect(stored.status()).toBe(201);
  const { id: draftId } = await stored.json();
  await page.getByRole('link', { name: 'My classes', exact: true }).click();

  for (let visit = 0; visit < 2; visit++) {
    for (const mode of ['Resume', 'Edit']) {
      const link = mode === 'Resume'
        ? page.getByTestId('class-draft').filter({ hasText: 'E2E Navigation Keeper' }).getByRole('link', { name: 'Resume', exact: true })
        : page.getByRole('link', { name: 'Edit E2E Navigation Keeper', exact: true });
      await link.click();
      await expect(page.getByRole('heading', { name: `${mode} a class`, exact: true })).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'Class name', exact: true })).toHaveValue('E2E Navigation Keeper');
      await page.getByRole('button', { name: 'Stats & dice', exact: true }).last().click();
      await expect(page.getByRole('radiogroup', { name: 'HP die (+ TOU)', exact: true }).getByRole('radio', { name: 'd12', exact: true })).toHaveAttribute('aria-checked', 'true');
      await page.getByRole('button', { name: 'Class Items', exact: true }).last().click();
      await expect(page.getByText('Navigation Hook', { exact: true })).toBeVisible();
      await page.getByRole('link', { name: 'GM', exact: true }).click();
      await page.getByRole('link', { name: 'My classes', exact: true }).click();
    }
  }
  for (const path of [`/gm/classes/draft/${draftId}`, `/gm/classes/${id}`]) {
    await page.goto(path);
    await expect(page.getByRole('textbox', { name: 'Class name', exact: true })).toHaveValue('E2E Navigation Keeper');
  }
});

test('a party player opens the correct private class details from their sheet without reloading', async ({ page, browser }) => {
  test.setTimeout(90000);
  await page.goto('/gm');
  const { token } = await (await page.request.get('/api/csrf-token')).json();
  const headers = { 'x-csrf-token': token };
  const saved = await page.request.post('/api/classes', { headers, data: { draft: navigationDraft } });
  expect(saved.status()).toBe(201);
  const cls = await saved.json();
  const createdParty = await page.request.post('/api/parties', { headers, data: { name: 'Class navigation table' } });
  expect(createdParty.status()).toBe(201);
  const party = await createdParty.json();
  const pool = await (await page.request.get(`/api/parties/${party.id}/class-pool`)).json();
  const lineage = pool.classes.find((entry: { classId: number }) => entry.classId === cls.id);
  expect(lineage).toBeTruthy();
  const enabled = await page.request.put(`/api/parties/${party.id}/class-pool/lineages/${lineage.lineageId}`, { headers, data: { enabled: true } });
  expect(enabled.ok()).toBe(true);
  const actor = await createTestUser('Navigation player');
  const context = await browser.newContext();
  await prepareActorContext(context, actor.sessionCookie);
  try {
    const player = await context.newPage();
    await player.goto(`/join/${party.inviteToken}`);
    const { token: playerToken } = await (await player.request.get('/api/csrf-token')).json();
    const playerHeaders = { 'x-csrf-token': playerToken };
    const rolled = await player.request.post(`/api/characters/draft?locale=en&invite=${party.inviteToken}`, { headers: playerHeaders, data: { classId: cls.id } });
    expect(rolled.ok()).toBe(true);
    const preview = await rolled.json();
    const confirmed = await player.request.post(`/api/characters/new?locale=en&invite=${party.inviteToken}`, { headers: playerHeaders, data: { draft: preview.draft } });
    expect(confirmed.status()).toBe(201);
    const character = await confirmed.json();
    for (let visit = 0; visit < 2; visit++) {
      await player.goto(`/party/${party.id}/character/${character.id}`);
      await player.getByRole('link', { name: 'E2E Navigation Keeper', exact: true }).click();
      await expect(player.getByRole('heading', { name: 'E2E Navigation Keeper', exact: true })).toBeVisible();
      await expect(player.getByText('Navigation Hook', { exact: true })).toBeVisible();
      await player.reload();
      await expect(player.getByRole('heading', { name: 'E2E Navigation Keeper', exact: true })).toBeVisible();
    }
  } finally {
    await context.close();
  }
});
