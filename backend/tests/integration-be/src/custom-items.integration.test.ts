import assert from 'node:assert/strict';
import test from 'node:test';

const baseUrl = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

class CookieJar {
  readonly cookies = new Map<string, string>();

  capture(response: Response): void {
    const setCookies =
      typeof response.headers.getSetCookie === 'function'
        ? response.headers.getSetCookie()
        : [];

    if (setCookies.length === 0) {
      const single = response.headers.get('set-cookie');
      if (single) setCookies.push(single);
    }

    for (const rawCookie of setCookies) {
      const firstChunk = rawCookie.split(';')[0];
      const separator = firstChunk.indexOf('=');
      if (separator <= 0) continue;
      const key = firstChunk.slice(0, separator).trim();
      const value = firstChunk.slice(separator + 1).trim();
      if (!key || !value) continue;
      this.cookies.set(key, value);
    }
  }

  header(): string {
    return [...this.cookies.entries()]
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
  }
}

async function request(
  path: string,
  options: {
    method?: string;
    json?: unknown;
    headers?: Record<string, string>;
    jar?: CookieJar;
  } = {},
): Promise<Response> {
  const { method = 'GET', json, headers = {}, jar } = options;

  const requestHeaders: Record<string, string> = { ...headers };
  if (jar) {
    const cookieHeader = jar.header();
    if (cookieHeader) requestHeaders.cookie = cookieHeader;
  }

  let body: string | undefined;
  if (json !== undefined) {
    requestHeaders['content-type'] = 'application/json';
    body = JSON.stringify(json);
  }

  const response = await fetch(new URL(path, baseUrl), {
    method,
    headers: requestHeaders,
    body,
  });

  if (jar) jar.capture(response);
  return response;
}

async function fetchCsrfToken(jar: CookieJar): Promise<string> {
  const response = await request('/api/csrf-token', { jar });
  assert.equal(response.status, 200, 'CSRF token fetch should succeed');
  const { token } = (await response.json()) as { token: string };
  return token;
}

async function expectStatus(
  response: Response,
  expectedStatus: number,
): Promise<void> {
  if (response.status === expectedStatus) return;
  const payload = await response.text();
  assert.fail(
    `${response.url} returned ${response.status}, expected ${expectedStatus}. Payload: ${payload}`,
  );
}

async function bootstrapAnonymousSession(): Promise<CookieJar> {
  const jar = new CookieJar();
  const response = await request('/api/auth/sign-in/anonymous', {
    method: 'POST',
    json: {},
    jar,
  });
  assert.equal(response.status, 200, 'anonymous sign-in should succeed');
  return jar;
}

async function createCharacter(jar: CookieJar): Promise<string> {
  const csrf = await fetchCsrfToken(jar);
  const response = await request('/api/characters/new', {
    method: 'POST',
    json: {},
    headers: { 'x-csrf-token': csrf },
    jar,
  });
  assert.equal(response.status, 201, 'character creation should succeed');
  const { id } = (await response.json()) as { id: string };
  return id;
}

type CharacterResponse = {
  id: string;
  equipment?: Array<Record<string, unknown>>;
  equippedWeapons?: Array<Record<string, unknown>>;
  equippedArmor?: Record<string, unknown> | null;
  computedModifiers?: Array<Record<string, unknown>>;
};

async function patchAndFetch(
  jar: CookieJar,
  id: string,
  patch: Record<string, unknown>,
): Promise<CharacterResponse> {
  const csrf = await fetchCsrfToken(jar);
  const patchResponse = await request(`/api/characters/${id}`, {
    method: 'PATCH',
    json: patch,
    headers: { 'x-csrf-token': csrf },
    jar,
  });
  await expectStatus(patchResponse, 200);
  return (await patchResponse.json()) as CharacterResponse;
}

// ── Custom item round-trips ────────────────────────────────────────────────────

test('custom weapon with modifier round-trips through PATCH→GET', async () => {
  const jar = await bootstrapAnonymousSession();
  const id = await createCharacter(jar);

  const customWeaponKey = `custom.weapon.${Date.now()}-w`;
  const result = await patchAndFetch(jar, id, {
    equippedWeapons: [
      {
        key: customWeaponKey,
        name: 'Rusted shiv',
        description: 'Found in a corpse',
        comments: 'Pristine condition',
        source: 'custom',
        category: 'weapon',
        value: 12,
        dice: [4],
        tags: ['custom', 'weapon'],
        modifiers: [
          {
            id: 'mod-w-1',
            name: 'Rusted shiv',
            source: 'Rusted shiv',
            value: -1,
            statistic: 'agility',
            exclude: ['ranged', 'cast', 'ability'],
            scope: 'melee',
          },
        ],
      },
    ],
  });

  const weapon = result.equippedWeapons?.[0];
  assert.ok(weapon, 'equipped weapon should round-trip');
  assert.equal(weapon.key, customWeaponKey);
  assert.equal(weapon.name, 'Rusted shiv');
  assert.equal(weapon.value, 12);
  // dice must round-trip as JSON integers — the response schema declares
  // `dice: { items: { type: 'integer' } }`, and fast-json-stringify's strict
  // oneOf for equippedArmor rejected string dice in prod (req-k/p/t).
  assert.deepEqual(weapon.dice, [4]);
  const weaponModifiers = weapon.modifiers as Array<Record<string, unknown>>;
  assert.equal(weaponModifiers?.length, 1);
  assert.equal(weaponModifiers[0].value, -1);
  assert.equal(weaponModifiers[0].scope, 'melee');

  // Custom-weapon modifiers should be reflected in computed modifiers
  const computed = (result.computedModifiers ?? []).filter(
    (m) => m.origin === 'weapon' && m.originKey === customWeaponKey,
  );
  assert.equal(
    computed.length,
    1,
    'custom weapon modifier should appear in computedModifiers',
  );
});

test('custom armor with tag round-trips and emits max_tier/current_tier', async () => {
  const jar = await bootstrapAnonymousSession();
  const id = await createCharacter(jar);

  const customArmorKey = `custom.armor.${Date.now()}-a`;
  const result = await patchAndFetch(jar, id, {
    equippedArmor: {
      key: customArmorKey,
      name: 'Patchwork hide',
      source: 'custom',
      category: 'armor',
      value: 30,
      dice: [4],
      tags: ['custom', 'armor', 'medium-armor'],
      maxTier: 2,
      currentTier: 2,
      modifiers: [
        {
          id: 'mod-a-1',
          name: 'Patchwork hide',
          source: 'Patchwork hide',
          value: -1,
          statistic: 'agility',
          exclude: [],
          scope: 'all',
        },
      ],
    },
  });

  const armor = result.equippedArmor;
  assert.ok(armor, 'equipped armor should round-trip');
  assert.equal(armor.maxTier, 2);
  assert.equal(armor.currentTier, 2);
  assert.ok(
    Array.isArray(armor.tags) && (armor.tags as string[]).includes('armor'),
    'armor tags should preserve "armor"',
  );

  const computed = (result.computedModifiers ?? []).filter(
    (m) => m.origin === 'armor' && m.originKey === customArmorKey,
  );
  assert.equal(
    computed.length,
    1,
    'custom armor modifier should appear in computedModifiers',
  );
});

test('non-armor item with stray maxTier does NOT synthesize an armor block', async () => {
  // Regression guard for the tag-based armor sub-object gate: an item that lacks
  // both a catalog match and an "armor" tag should never produce max_tier/
  // current_tier in the resolved output, even if those keys leaked into JSONB.
  const jar = await bootstrapAnonymousSession();
  const id = await createCharacter(jar);

  const result = await patchAndFetch(jar, id, {
    equipment: [
      {
        key: `custom.misc.${Date.now()}-m`,
        name: 'Strange trinket',
        source: 'custom',
        category: 'misc',
        tags: ['custom'],
        // No "armor" tag; this item is NOT armor.
      },
    ],
  });

  const trinket = result.equipment?.[0];
  assert.ok(trinket, 'equipment item should round-trip');
  assert.equal(
    'maxTier' in trinket,
    false,
    'misc item should not emit maxTier',
  );
  assert.equal(
    'currentTier' in trinket,
    false,
    'misc item should not emit currentTier',
  );
});

test('custom consumable preserves useCountRule on the JSONB', async () => {
  const jar = await bootstrapAnonymousSession();
  const id = await createCharacter(jar);

  const result = await patchAndFetch(jar, id, {
    equipment: [
      {
        key: `custom.consumable.${Date.now()}-c`,
        name: 'Bottle of black mead',
        source: 'custom',
        category: 'consumable',
        tags: ['custom', 'consumable'],
        uses: [false, false, false],
        useCountRule: {
          mode: 'fixedPlusModifier',
          base: 3,
          statistic: 'presence',
        },
      },
    ],
  });

  const consumable = result.equipment?.[0];
  assert.ok(consumable, 'consumable should round-trip');
  const rule = consumable.useCountRule as Record<string, unknown> | undefined;
  assert.ok(rule, 'useCountRule should be present on resolved consumable');
  assert.equal(rule.mode, 'fixedPlusModifier');
  assert.equal(rule.base, 3);
  assert.equal(rule.statistic, 'presence');
});
