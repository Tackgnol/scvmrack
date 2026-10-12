import { expect, test } from '../../fixtures.js';

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
