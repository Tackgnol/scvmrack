import {
  test,
  expect,
  createTestUser,
  createSeededCharacter,
  prepareActorContext,
} from '../../fixtures.js';
import type { APIRequestContext, Page } from '@playwright/test';

async function mutate(
  client: APIRequestContext,
  path: string,
  body: unknown,
  method = 'POST'
) {
  const csrf = (await (await client.get('/api/csrf-token')).json()) as {
    token: string;
  };
  const response = await client.fetch(path, {
    method,
    data: body,
    headers: { 'csrf-token': csrf.token },
  });
  expect(response.ok(), await response.text()).toBe(true);
  return response.status() === 204 ? null : response.json();
}

async function openRoster(page: Page, roomId: string, rejectCleanup: boolean) {
  const snapshot = await (await page.request.get(`/api/obr/rooms/${roomId}/participation`)).json();
  await page.addInitScript(({ roomId, rejectCleanup, binding }) => {
    Object.assign(window, { obrContract: { roomId, rejectCleanup, binding } });
  }, { roomId, rejectCleanup, binding: snapshot.tokens[0] ?? null });
  await page.route(
    /\/node_modules\/\.vite\/deps\/@owlbear-rodeo_sdk\.js/,
    (route) =>
      route.fulfill({
        contentType: 'application/javascript',
        body: `
      const state = window.obrContract;
      const token = { id: 'token-1', metadata: state.binding ? { 'co.rpgtools.scvmrack/characterId': state.binding.characterId, 'co.rpgtools.scvmrack/binding-generation': state.binding.generation } : {}, position: { x: 0, y: 0 } };
      state.token = token;
      const sdk = {
        onReady: callback => { callback(); return () => {}; },
        room: { id: state.roomId },
        player: { getId: async () => 'gm', getRole: async () => 'GM', getConnectionId: async () => 'gm', getName: async () => 'GM', getSelection: async () => [] },
        party: { getPlayers: async () => [], onChange: () => () => {} },
        broadcast: { onMessage: () => () => {}, sendMessage: async () => {} },
        scene: { isReady: async () => true, onReadyChange: () => () => {}, items: {
          getItems: async () => [token], onChange: () => () => {},
          updateItems: async (ids, update) => { if (state.rejectCleanup) { throw Error('Scene unavailable'); } update([token]); },
          deleteItems: async () => {},
        } },
      };
      export default sdk;
      export const buildLabel = () => ({ name: () => ({ build: () => ({}) }) });
    `,
      })
  );
  await page.goto('/faq');
  await page.addScriptTag({
    type: 'module',
    url: '/test/contracts/roster.tsx',
  });
}

test('room removal survives scene failure and reopening through the real API', async ({
  page,
  browser,
}) => {
  const roomId = `contract-${crypto.randomUUID()}`;
  const party = await mutate(page.request, '/api/parties/promote', {
    obrRoomId: roomId,
    name: 'Contract room',
  });
  const player = await createTestUser('Contract player');
  const scvm = await createSeededCharacter(player.userId, {
    name: 'Contract scvm',
  });
  const context = await browser.newContext();
  await prepareActorContext(context, player.sessionCookie);
  try {
    await mutate(context.request, '/api/parties/join', {
      token: party.inviteToken,
      characterId: scvm.id,
    });
    await mutate(
      context.request,
      `/api/obr/rooms/${roomId}/tokens/token-1/character`,
      { characterId: scvm.id },
      'PUT'
    );
    await openRoster(page, roomId, true);
    const roster = page.locator('#contract-root');
    await roster
      .getByRole('button', { name: 'Remove from roster', exact: true })
      .click();
    await expect(
      roster.getByText('Removed; scene cleanup pending', { exact: true })
    ).toBeVisible();
    const projection = await (
      await page.request.get(`/api/obr/rooms/${roomId}/participation`)
    ).json();
    expect(projection.memberIds).toEqual([]);
    expect(projection.tokens).toEqual([]);
    expect(projection.cleanup).toHaveLength(1);
    await page.reload();
    await page.addScriptTag({
      type: 'module',
      url: '/test/contracts/roster.tsx',
    });
    await page.evaluate(() => {
      (
        window as unknown as { obrContract: { rejectCleanup: boolean } }
      ).obrContract.rejectCleanup = false;
    });
    await roster
      .getByRole('button', { name: 'Retry scene cleanup', exact: true })
      .click();
    await expect(
      roster.getByText('Scene cleanup complete', { exact: true })
    ).toBeVisible();
    expect(
      (
        await (
          await page.request.get(`/api/obr/rooms/${roomId}/participation`)
        ).json()
      ).cleanup
    ).toEqual([]);
    await expect(roster.getByRole('button', { name: 'Remove from roster', exact: true })).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { obrContract: { token: { metadata: unknown } } }).obrContract.token.metadata)).toEqual({});
  } finally {
    await context.close();
  }
});


test('a live join reaches the open GM roster and its first removal stays removed', async ({ page, browser }) => {
  const roomId = `live-${crypto.randomUUID()}`;
  const party = await mutate(page.request, '/api/parties/promote', { obrRoomId: roomId, name: 'Live roster' });
  const player = await createTestUser('Live player');
  const scvm = await createSeededCharacter(player.userId, { name: 'Late arrival' });
  const context = await browser.newContext();
  await prepareActorContext(context, player.sessionCookie);
  try {
    await openRoster(page, roomId, false);
    const roster = page.locator('#contract-root');
    await expect(roster.getByRole('button', { name: 'Remove from roster', exact: true })).toHaveCount(0);
    await mutate(context.request, '/api/parties/join', { token: party.inviteToken, characterId: scvm.id });
    await expect(roster.getByText('Late arrival', { exact: true })).toBeVisible();
    await roster.getByRole('button', { name: 'Remove from roster', exact: true }).click();
    await expect(roster.getByRole('button', { name: 'Remove from roster', exact: true })).toHaveCount(0);
    const state = await (await page.request.get(`/api/obr/rooms/${roomId}/participation`)).json();
    expect(state.memberIds).toEqual([]);
    await page.reload();
    await page.addScriptTag({ type: 'module', url: '/test/contracts/roster.tsx' });
    await expect(roster.getByText('Late arrival', { exact: true })).toHaveCount(0);
  } finally {
    await context.close();
  }
});
