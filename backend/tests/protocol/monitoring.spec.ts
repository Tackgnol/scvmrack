import { test, expect } from './fixtures.js';

test('a first report in flight survives leaving a public page without an unload CSRF fetch', async ({ page, protocol }) => {
  await page.goto(`/test/contracts/protocol.html?api=${encodeURIComponent(protocol.apiOrigin)}`);
  await expect(page.getByRole('button', { name: 'Report error' })).toBeVisible();
  await expect.poll(() => protocol.csrfRequests).toBe(1);
  protocol.hold = true;
  const sent = page.waitForRequest(request => request.url().endsWith('/api/tunnel'));
  await page.getByRole('button', { name: 'Report error' }).click();
  await sent;
  await page.goto('about:blank');
  await expect.poll(() => protocol.envelopes.length).toBe(1);
  protocol.release();
  await expect.poll(() => protocol.statuses).toEqual([200]);
  expect(protocol.csrfRequests).toBe(1);
  expect(protocol.anonymousRequests).toBe(0);
  expect(protocol.db.user).toHaveLength(0);
  expect(protocol.envelopes[0]).toContain('protocol-monitoring-error');
});

test('a rotated CSRF secret causes one refresh and one accepted envelope; missing protection is rejected', async ({ page, context, protocol }) => {
  await page.goto(`/test/contracts/protocol.html?api=${encodeURIComponent(protocol.apiOrigin)}`);
  await expect(page.getByRole('button', { name: 'Report error' })).toBeVisible();
  await expect.poll(() => protocol.csrfRequests).toBe(1);
  await context.clearCookies();
  await page.getByRole('button', { name: 'Report error' }).click();
  await expect.poll(() => protocol.statuses).toEqual([403, 200]);
  expect(protocol.csrfRequests).toBe(2);
  expect(protocol.envelopes).toHaveLength(1);
  const rejected = await page.request.post(protocol.apiOrigin + '/api/tunnel', {
    headers: { 'content-type': 'application/x-sentry-envelope' }, data: protocol.envelopes[0],
  });
  expect(rejected.status()).toBe(403);
  expect(protocol.envelopes).toHaveLength(1);
  expect(protocol.db.user).toHaveLength(0);
});
