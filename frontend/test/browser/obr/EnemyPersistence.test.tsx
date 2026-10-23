import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { resetRedirectControl } from '@/api';
import type { EnemyFull, EnemyInput } from '@/api/enemies';
import { ObrEnemyManager } from '@/components/obr/enemies/ObrEnemyManager';
import { useObrEnemies } from '@/obr/useObrEnemies';
import BrowserTestProvider from '../BrowserTestProvider';

const transport = vi.hoisted(() => {
  const fetch = vi.fn();
  const original = globalThis.fetch;
  const proxy: typeof globalThis.fetch = (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    return url.includes('/api/') ? fetch(input, init) : original(input, init);
  };
  vi.stubGlobal('fetch', proxy);
  return { fetch, proxy };
});

vi.mock('@owlbear-rodeo/sdk', () => ({
  default: {
    onReady: (ready: () => void) => ready(),
    broadcast: { onMessage: () => () => {}, sendMessage: async () => {} },
    scene: { isReady: async () => false, onReadyChange: () => () => {},
      items: { getItems: async () => [], onChange: () => () => {} } },
  },
  buildLabel: vi.fn(),
}));

function ComposedEnemyBoard() {
  const state = useObrEnemies({ mode: 'gm', roomId: 'qa-room' });
  return <ObrEnemyManager {...state} bindEnemy={async () => 0} />;
}

const endpoint = '/api/parties/by-room/qa-room/enemies';
let enemies: EnemyFull[];
let writes: { method: string; path: string; body: unknown }[];
let holdHealth: boolean;
let releaseHealth: (() => void)[];
let rejectNextWrite: boolean;
let rejectHealthRequest: number;
let healthRequests: number;
let missingResource: 'ENEMY_NOT_FOUND' | 'PARTY_NOT_FOUND' | null;

const seedEnemy: EnemyFull = {
  id: '11111111-1111-4111-8111-111111111111', partyId: 'qa-party', name: 'Ash Wight',
  type: 'Undead', habitat: 'Chapel', description: 'GM secret', playerDescription: 'Ash falls.',
  currentHealth: 8, maxHealth: 8, healthPercent: 100, morale: 7, armorDie: '-d2', armorDescription: '',
  attacks: [], specials: [], loot: [], statuses: [{ id: 'healthy', percent: 100, label: 'Healthy' }],
};

beforeEach(() => {
  resetRedirectControl();
  enemies = [];
  writes = [];
  holdHealth = false;
  releaseHealth = [];
  rejectNextWrite = false;
  rejectHealthRequest = 0;
  healthRequests = 0;
  missingResource = null;
  vi.stubGlobal('fetch', transport.proxy);
  transport.fetch.mockImplementation(async (input: RequestInfo | URL) => {
    const request = input instanceof Request ? input : new Request(input);
    const path = new URL(request.url).pathname;
    if (path.endsWith('/csrf-token')) {
      return Response.json({ token: 'qa-csrf' });
    }
    if (path === endpoint && request.method === 'GET') {
      return Response.json(enemies);
    }
    if (missingResource) {
      return Response.json({ code: missingResource, message: 'Not found', statusCode: 404 }, { status: 404 });
    }
    const body: EnemyInput = await request.json();
    writes.push({ method: request.method, path, body });
    if (rejectNextWrite) {
      rejectNextWrite = false;
      return Response.json({ code: 'VALIDATION_ERROR', message: 'Invalid params', statusCode: 400 }, { status: 400 });
    }
    const healthEnemy = enemies.find(item => path === `${endpoint}/${item.id}/health`);
    if (healthEnemy && request.method === 'PATCH') {
      const reject = ++healthRequests === rejectHealthRequest;
      if (holdHealth) {
        await new Promise<void>(resolve => releaseHealth.push(resolve));
      }
      if (reject) {
        return Response.json({ code: 'INTERNAL_ERROR', message: 'Health save failed', statusCode: 503 }, { status: 503 });
      }
      healthEnemy.currentHealth = body.currentHealth;
      healthEnemy.healthPercent = Math.round(body.currentHealth / healthEnemy.maxHealth * 100);
      return Response.json(healthEnemy);
    }
    if (path === endpoint && request.method === 'POST') {
      const created: EnemyFull = {
        ...seedEnemy, ...body, id: crypto.randomUUID(),
        attacks: (body.attacks ?? []).map(row => ({ ...row, die: row.die ?? '' })),
        specials: (body.specials ?? []).map(row => ({ ...row, description: row.description ?? '' })),
        loot: (body.loot ?? []).map(row => ({ ...row, value: row.value ?? '' })),
      };
      enemies.push(created);
      return Response.json(created, { status: 201 });
    }
    const enemy = enemies.find(item => path === `${endpoint}/${item.id}`);
    if (enemy && request.method === 'PATCH') {
      Object.assign(enemy, body);
      return Response.json(enemy);
    }
    return Response.json({ code: 'VALIDATION_ERROR', message: 'Invalid params', statusCode: 400 }, { status: 400 });
  });
});

it('keeps every rapid wound and heal across reopening and clamps health (RPG-333)', async () => {
  enemies = [structuredClone(seedEnemy)];
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const view = await render(<BrowserTestProvider><QueryClientProvider client={client}><ComposedEnemyBoard /></QueryClientProvider></BrowserTestProvider>);
  await expect.element(page.getByText('8/8 HP', { exact: true })).toBeVisible();
  holdHealth = true;
  for (let click = 0; click < 4; click++) {
    await userEvent.click(page.getByRole('button', { name: 'Damage 1 HP', exact: true }));
  }
  await expect.poll(() => releaseHealth.length).toBeGreaterThan(0);
  holdHealth = false;
  releaseHealth.splice(0).forEach(release => release());
  await expect.element(page.getByText('4/8 HP', { exact: true })).toBeVisible();
  await view.rerender(<BrowserTestProvider><QueryClientProvider client={client}><ComposedEnemyBoard key="after-wounds" /></QueryClientProvider></BrowserTestProvider>);
  await expect.element(page.getByText('4/8 HP', { exact: true })).toBeVisible();
  holdHealth = true;
  for (let click = 0; click < 4; click++) {
    await userEvent.click(page.getByRole('button', { name: 'Heal 1 HP', exact: true }));
  }
  await expect.poll(() => releaseHealth.length).toBeGreaterThan(0);
  holdHealth = false;
  releaseHealth.splice(0).forEach(release => release());
  await expect.element(page.getByText('8/8 HP', { exact: true })).toBeVisible();
  await view.rerender(<BrowserTestProvider><QueryClientProvider client={client}><ComposedEnemyBoard key="after-heals" /></QueryClientProvider></BrowserTestProvider>);
  await expect.element(page.getByText('8/8 HP', { exact: true })).toBeVisible();
  holdHealth = true;
  for (const action of ['Damage 1 HP', 'Heal 1 HP', 'Damage 1 HP']) {
    await userEvent.click(page.getByRole('button', { name: action, exact: true }));
  }
  await expect.poll(() => releaseHealth.length).toBeGreaterThan(0);
  holdHealth = false;
  releaseHealth.splice(0).forEach(release => release());
  await expect.element(page.getByText('7/8 HP', { exact: true })).toBeVisible();
  await userEvent.click(page.getByRole('button', { name: 'Heal 1 HP', exact: true }));
  await expect.element(page.getByText('8/8 HP', { exact: true })).toBeVisible();
  for (let click = 0; click < 10; click++) {
    await userEvent.click(page.getByRole('button', { name: 'Damage 1 HP', exact: true }));
  }
  await expect.element(page.getByText('0/8 HP', { exact: true })).toBeVisible();
  for (let click = 0; click < 10; click++) {
    await userEvent.click(page.getByRole('button', { name: 'Heal 1 HP', exact: true }));
  }
  await expect.element(page.getByText('8/8 HP', { exact: true })).toBeVisible();
  await expect.poll(() => writes.length).toBe(32);
  expect(writes.every(write => {
    const health = (write.body as { currentHealth: number }).currentHealth;
    return health >= 0 && health <= 8;
  })).toBe(true);
});

afterEach(() => vi.unstubAllGlobals());

it('creates, clones and edits enemies through the real shared hook and HTTP adapter (RPG-332)', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const view = await render(<BrowserTestProvider><QueryClientProvider client={client}><ComposedEnemyBoard /></QueryClientProvider></BrowserTestProvider>);
  await userEvent.click(page.getByRole('button', { name: 'New enemy', exact: true }));
  await userEvent.fill(page.getByRole('textbox', { name: 'Name', exact: true }), 'Ash Wight');
  await userEvent.click(page.getByRole('button', { name: 'Save enemy', exact: true }));
  await expect.element(page.getByText('Ash Wight', { exact: true })).toBeVisible();
  await view.rerender(<BrowserTestProvider><QueryClientProvider client={client}><ComposedEnemyBoard key="reopened" /></QueryClientProvider></BrowserTestProvider>);
  await userEvent.click(page.getByRole('button', { name: 'Clone', exact: true }));
  await expect.element(page.getByText('Ash Wight 2', { exact: true })).toBeVisible();
  await userEvent.click(page.getByRole('button', { name: 'Edit', exact: true }).last());
  await userEvent.fill(page.getByRole('textbox', { name: 'Name', exact: true }), 'Ash Wight Prime');
  await userEvent.click(page.getByRole('button', { name: 'Save enemy', exact: true }));
  await expect.element(page.getByText('Ash Wight Prime', { exact: true })).toBeVisible();
  await view.rerender(<BrowserTestProvider><QueryClientProvider client={client}><ComposedEnemyBoard key="reopened-again" /></QueryClientProvider></BrowserTestProvider>);
  await expect.element(page.getByText('Ash Wight', { exact: true })).toBeVisible();
  await expect.element(page.getByText('Ash Wight Prime', { exact: true })).toBeVisible();
  expect(writes.map(write => write.method)).toEqual(['POST', 'POST', 'PATCH']);
  expect(writes[2].path).toMatch(/\/enemies\/[0-9a-f-]{36}$/);
});

it('keeps a refused enemy form retryable without claiming the attached room is missing (RPG-332)', async () => {
  rejectNextWrite = true;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  await render(<BrowserTestProvider><QueryClientProvider client={client}><ComposedEnemyBoard /></QueryClientProvider></BrowserTestProvider>);
  await userEvent.click(page.getByRole('button', { name: 'New enemy', exact: true }));
  await userEvent.fill(page.getByRole('textbox', { name: 'Name', exact: true }), 'Ash Wight');
  await userEvent.click(page.getByRole('button', { name: 'Save enemy', exact: true }));
  await expect.element(page.getByRole('alert')).toHaveTextContent('Could not save enemy');
  await expect.element(page.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue('Ash Wight');
  await userEvent.click(page.getByRole('button', { name: 'Save enemy', exact: true }));
  await expect.element(page.getByText('Ash Wight', { exact: true })).toBeVisible();
});

it('allows a new health action after a failed save instead of leaving the queue stuck (RPG-333)', async () => {
  enemies = [structuredClone(seedEnemy)];
  rejectNextWrite = true;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  await render(<BrowserTestProvider><QueryClientProvider client={client}><ComposedEnemyBoard /></QueryClientProvider></BrowserTestProvider>);
  await expect.element(page.getByText('8/8 HP', { exact: true })).toBeVisible();
  await userEvent.click(page.getByRole('button', { name: 'Damage 1 HP', exact: true }));
  await expect.element(page.getByRole('alert')).toHaveTextContent('Could not update health');
  await userEvent.click(page.getByRole('button', { name: 'Damage 1 HP', exact: true }));
  await expect.element(page.getByText('7/8 HP', { exact: true })).toBeVisible();
  await expect.element(page.getByRole('alert')).not.toBeInTheDocument();
});

it.each([1, 2])('continues queued damage when health save %i fails without losing earlier successes (RPG-333)', async failedRequest => {
  enemies = [structuredClone(seedEnemy)];
  rejectHealthRequest = failedRequest;
  holdHealth = true;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const view = await render(<BrowserTestProvider><QueryClientProvider client={client}><ComposedEnemyBoard /></QueryClientProvider></BrowserTestProvider>);
  await expect.element(page.getByText('8/8 HP', { exact: true })).toBeVisible();
  for (let click = 0; click < 4; click++) {
    await userEvent.click(page.getByRole('button', { name: 'Damage 1 HP', exact: true }));
  }
  await expect.poll(() => releaseHealth.length).toBeGreaterThan(0);
  holdHealth = false;
  releaseHealth.splice(0).forEach(release => release());
  await expect.element(page.getByRole('alert')).toHaveTextContent('Could not update health');
  await expect.element(page.getByText('5/8 HP', { exact: true })).toBeVisible();
  expect(healthRequests).toBe(4);
  await view.rerender(<BrowserTestProvider><QueryClientProvider client={client}><ComposedEnemyBoard key="reopened-after-failure" /></QueryClientProvider></BrowserTestProvider>);
  await expect.element(page.getByText('5/8 HP', { exact: true })).toBeVisible();
});

it.each((['health', 'edit', 'delete'] as const).flatMap(action =>
  (['ENEMY_NOT_FOUND', 'PARTY_NOT_FOUND'] as const).map(code => ({ action, code })),
))('distinguishes $code during an enemy $action action (RPG-332)', async ({ action, code }) => {
  enemies = [structuredClone(seedEnemy)];
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  await render(<BrowserTestProvider><QueryClientProvider client={client}><ComposedEnemyBoard /></QueryClientProvider></BrowserTestProvider>);
  await expect.element(page.getByText('Ash Wight', { exact: true })).toBeVisible();
  missingResource = code;
  enemies = [];
  if (action === 'edit') {
    await userEvent.click(page.getByRole('button', { name: 'Edit', exact: true }));
    await userEvent.click(page.getByRole('button', { name: 'Save enemy', exact: true }));
  } else {
    await userEvent.click(page.getByRole('button', { name: action === 'health' ? 'Damage 1 HP' : 'Delete', exact: true }));
  }
  await expect.element(page.getByRole('alert')).toHaveTextContent(code === 'ENEMY_NOT_FOUND'
    ? 'Enemy not found'
    : 'Move this room to scvmrack before saving enemies.');
});
