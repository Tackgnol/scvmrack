import { test, expect } from './fixtures.js';
import type { Page } from '@playwright/test';

async function waitForApprovalPage(popup: Page, apiOrigin: string) {
  await popup.waitForURL(
    url => url.origin === apiOrigin && url.pathname === '/approval-fixture',
    { waitUntil: 'load', timeout: 15000 }
  );
  await expect(popup.getByRole('button', { name: 'Approve sign-in' })).toBeVisible();
}

test.beforeEach(async ({ context, protocol }) => {
  const actor = await context.request.post(protocol.apiOrigin + '/api/auth/sign-in/anonymous', { data: {} });
  expect(actor.status()).toBe(200);
  const user = (await actor.json()).user;
  Object.assign(protocol.db.user.find(row => row.id === user.id)!, { isAnonymous: false, name: 'Protocol actor', email: 'actor@example.invalid' });
});

for (const abortDuring of ['none', 'redemption', 'confirmation']) {
test(`browser isolation transfers the guest to the approved account with abort during ${abortDuring}`, async ({ page, context, protocol }) => {
  const { user } = await (await context.request.get(protocol.apiOrigin + '/api/auth/get-session')).json();
  const providerCookies = await context.cookies();
  await page.addInitScript(() => {
    const open = window.open;
    window.open = function (...args) {
      const popup = open.apply(window, args);
      (window as typeof window & { popupHandle: Window | null }).popupHandle = popup;
      return popup;
    };
  });
  await page.goto(`/test/contracts/popup.html?api=${encodeURIComponent(protocol.apiOrigin)}&abortDuring=${abortDuring}`);
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
  // The provider fixture restores the first-party login; the initiator keeps its guest bearer.
  await context.addCookies(providerCookies);
  const popupOpened = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  const popup = await popupOpened;
  await waitForApprovalPage(popup, protocol.apiOrigin);
  await expect.poll(() => page.evaluate(() => (window as typeof window & { popupHandle: Window }).popupHandle.closed)).toBe(true);
  expect(popup.isClosed()).toBe(false);
  expect(await popup.evaluate(() => window.opener)).toBeNull();
  const code = await page.getByRole('status').textContent();
  const guestId = await page.getByRole('status').getAttribute('data-guest-id');
  expect(code).toMatch(/^[A-F0-9]{6}$/);
  // Wait for several pending polls while the handle reports closed.
  const polls: string[] = [];
  page.on('response', response => { if (response.url().endsWith('/obr-handoff/take')) { polls.push(response.url()); } });
  await expect.poll(() => polls.length, { timeout: 10000 }).toBeGreaterThanOrEqual(3);
  await expect(page.getByRole('button', { name: 'Cancel sign-in' })).toBeEnabled();
  expect(protocol.claims).toEqual([]);
  await popup.getByRole('textbox', { name: 'Code from the extension' }).fill(code!);
  await popup.getByRole('button', { name: 'Approve sign-in' }).click();
  await expect(page.getByRole('status')).toHaveText(`Signed in as ${user.id}`);
  expect(protocol.claims).toEqual([{ guestId, userId: user.id }]);
  await popup.close();
});
}

test('explicit cancellation makes an isolated approval unusable and leaves the guest unclaimed', async ({ page, context, protocol }) => {
  const providerCookies = await context.cookies();
  await page.goto(`/test/contracts/popup.html?api=${encodeURIComponent(protocol.apiOrigin)}`);
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
  await context.addCookies(providerCookies);
  const opened = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  const popup = await opened;
  await waitForApprovalPage(popup, protocol.apiOrigin);
  const handoffId = new URL(popup.url()).searchParams.get('handoffId');
  await page.getByRole('button', { name: 'Cancel sign-in' }).click();
  await expect(page.getByRole('status')).toHaveText('handoff-cancelled');
  await expect.poll(async () => (await context.request.post(protocol.apiOrigin + '/api/auth/obr-handoff/inspect', {
    data: { handoffId }, headers: { origin: 'http://127.0.0.1:5278' },
  })).status()).toBe(410);
  expect(protocol.claims).toEqual([]);
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeEnabled();
  await popup.close();
});
