import { expect, test, type Page } from '@playwright/test';

const characterId = '11111111-1111-4111-8111-111111111111';
const guest = { session: { id: 'session' }, user: { id: 'guest', isAnonymous: true } };
const character = {
  id: characterId, name: 'Recovered Scvm', classId: 1, className: 'Test Scvm',
  strength: 10, agility: 10, presence: 10, toughness: 10,
  maxHp: 5, currentHp: 5, omens: 2, silver: 50,
  equipment: [], storage: [], equippedWeapons: [], equippedArmor: null, abilities: [],
};

async function publicApi(page: Page, initialSession: unknown = null) {
  let session = initialSession;
  const calls: string[] = [];
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (!path.startsWith('/api/')) {
      await route.continue();
      return;
    }
    const call = `${request.method()} ${path}`;
    if (request.method() !== 'OPTIONS') calls.push(call);
    let body: unknown = {};
    let status = 200;
    if (path === '/api/auth/get-session') body = session;
    else if (path === '/api/auth/sign-in/anonymous') { session = guest; body = guest; }
    else if (path === '/api/auth/sign-out') session = null;
    else if (path === '/api/characters/count') body = { count: 42 };
    else if (path === '/api/csrf-token') body = { token: 'test-csrf' };
    else if (path === '/api/characters') body = [];
    else if (path === '/api/characters/classes') body = {
      classes: [{ id: 1, name: 'Test Scvm', description: 'A class for the session test.' }], classlessEnabled: true,
    };
    else if (path === '/api/classes/details/1') body = {
      attribution: 'Test author', reportable: true,
      draft: {
        name: { en: 'Public Test Class', pl: 'Publiczna klasa' },
        description: { en: 'Available without a session', pl: 'Dostępna bez sesji' },
        origins: [], abilities: [], items: [], gettingBetterRule: 'book', gettingBetterNote: { en: '', pl: '' },
      },
    };
    else if (path === '/api/characters/draft') {
      expect(session).toEqual(guest);
      body = {
        draft: { classId: 1, classless: false, seeds: Object.fromEntries(
          ['name', 'stats', 'omens', 'silver', 'origin', 'abilities', 'gear', 'personality']
            .map((section) => [section, 'a'.repeat(64)]),
        ) },
        preview: { ...character, id: undefined },
      };
    } else if (path === '/api/characters/new') {
      expect(session).toBeTruthy();
      status = 201;
      body = character;
    } else if (path === `/api/characters/${characterId}`) {
      status = session ? 200 : 403;
      body = session ? character : { message: 'Not your character' };
    }
    await route.fulfill({ status, json: body, headers: {
      'access-control-allow-origin': new URL(page.url()).origin,
      'access-control-allow-credentials': 'true',
      'access-control-allow-headers': 'content-type,x-csrf-token,authorization',
    } });
  });
  return calls;
}

async function acknowledgeStorage(page: Page) {
  await page.getByTestId('privacy-drawer-save-button').click();
  await expect(page.getByTestId('privacy-drawer-save-button')).toHaveCount(0);
}

test('public navigation and storage acknowledgement never create a guest owner', async ({ page }) => {
  const calls = await publicApi(page);
  await page.goto('/');
  await acknowledgeStorage(page);
  await expect(page.getByTestId('app-title')).toBeVisible();
  await page.locator('a[href="/faq"]').first().click();
  await expect(page).toHaveURL(/\/faq$/);
  await page.locator('a[href="/gm"]').first().click();
  await expect(page.getByTestId('gm-locked-preview')).toBeVisible();
  for (const path of ['/privacy', '/terms', '/legal', '/release', '/owlbear', '/report', '/classes/1', '/character/create']) {
    await page.goto(path);
    await expect(page.getByRole('main')).toBeVisible();
    if (path === '/classes/1') await expect(page.getByRole('heading', { name: 'Public Test Class' })).toBeVisible();
    if (path === '/character/create') await expect(page.getByTestId('class-gate-class-1')).toBeVisible();
  }
  expect(calls).toContain('GET /api/auth/get-session');
  expect(calls).not.toContain('GET /api/characters');
  expect(calls.filter((call) => call.startsWith('POST '))).toEqual([]);
});

test('choosing a draft starts a session before the draft request', async ({ page }) => {
  const calls = await publicApi(page);
  await page.goto('/character/create');
  await acknowledgeStorage(page);
  await expect(page.getByTestId('class-gate-class-1')).toBeVisible();
  expect(calls).not.toContain('POST /api/auth/sign-in/anonymous');
  await page.getByTestId('class-gate-class-1').click();
  await expect.poll(() => calls).toContain('POST /api/characters/draft');
  expect(calls.indexOf('POST /api/auth/sign-in/anonymous')).toBeLessThan(calls.indexOf('POST /api/characters/draft'));
  expect(calls.filter((call) => call === 'POST /api/auth/sign-in/anonymous')).toHaveLength(1);
  await expect(page.getByTestId('draft-stats')).toBeVisible();
  await page.getByTestId('create-confirm-button').click();
  await expect(page).toHaveURL(new RegExp(`/character/${characterId}$`));
  await expect(page.getByRole('textbox', { name: 'Hit Points', exact: true })).toHaveValue('5');
});

test('direct creation waits for storage acknowledgement and a session', async ({ page }) => {
  const calls = await publicApi(page);
  await page.goto('/character/new');
  await expect(page.getByTestId('privacy-drawer-save-button')).toBeVisible();
  expect(calls.filter((call) => call.startsWith('POST '))).toEqual([]);
  await acknowledgeStorage(page);
  await expect.poll(() => calls).toContain('POST /api/characters/new');
  expect(calls.indexOf('POST /api/auth/sign-in/anonymous')).toBeLessThan(calls.indexOf('GET /api/characters'));
  await expect(page.getByRole('textbox', { name: 'Hit Points', exact: true })).toHaveValue('5');
});

for (const path of [`/character/${characterId}`, `/character/new?character=${characterId}`]) {
test(`private character link ${path} shows recovery without minting an owner`, async ({ page }) => {
  const calls = await publicApi(page);
  await page.goto(path);
  await acknowledgeStorage(page);
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(calls).not.toContain('POST /api/auth/sign-in/anonymous');
  expect(calls).not.toContain('POST /api/characters/new');
});
}

test('legacy character entry does not mint a guest even when the existing router rejects it', async ({ page }) => {
  const calls = await publicApi(page);
  await page.goto(`/character?character=${characterId}`);
  await acknowledgeStorage(page);
  await expect(page.getByRole('heading', { name: '404', exact: true })).toBeVisible();
  expect(calls.filter((call) => call.startsWith('POST '))).toEqual([]);
});

test('returning guest and account sessions never create replacement guests', async ({ page }) => {
  for (const isAnonymous of [true, false]) {
    const calls = await publicApi(page, { ...guest, user: { ...guest.user, isAnonymous } });
    await page.goto(`/character/${characterId}`);
    const notice = page.getByTestId('privacy-drawer-save-button');
    if (await notice.isVisible()) await acknowledgeStorage(page);
    await expect(page.getByRole('textbox', { name: 'Hit Points', exact: true })).toHaveValue('5');
    expect(calls).toContain(`GET /api/characters/${characterId}`);
    expect(calls).not.toContain('POST /api/auth/sign-in/anonymous');
    await page.unrouteAll({ behavior: 'wait' });
  }
});
