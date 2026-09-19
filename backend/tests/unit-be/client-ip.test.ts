import assert from 'node:assert/strict';
import test from 'node:test';

import { clientIp } from '../../src/lib/client-ip.js';

const req = (ip: string, cf?: string) => ({
  ip,
  headers: cf === undefined ? {} : { 'cf-connecting-ip': cf },
});

test('clientIp uses CF-Connecting-IP when the peer is a private (Caddy) address', () => {
  assert.equal(clientIp(req('172.18.0.1', '203.0.113.7')), '203.0.113.7');
  assert.equal(clientIp(req('127.0.0.1', '203.0.113.7')), '203.0.113.7');
  assert.equal(clientIp(req('::ffff:172.18.0.1', '203.0.113.7')), '203.0.113.7');
  assert.equal(clientIp(req('::1', '2001:db8::7')), '2001:db8::7');
});

test('clientIp ignores CF-Connecting-IP from a public peer (direct origin hit)', () => {
  assert.equal(clientIp(req('198.51.100.9', '203.0.113.7')), '198.51.100.9');
});

test('clientIp falls back to the peer for a missing or malformed header', () => {
  assert.equal(clientIp(req('172.18.0.1')), '172.18.0.1');
  assert.equal(clientIp(req('172.18.0.1', 'not-an-ip')), '172.18.0.1');
  assert.equal(clientIp(req('172.18.0.1', '')), '172.18.0.1');
});

test('two visitors behind the same Caddy get distinct rate-limit keys', () => {
  assert.notEqual(
    clientIp(req('172.18.0.1', '203.0.113.7')),
    clientIp(req('172.18.0.1', '203.0.113.8'))
  );
});

test('one visitor exhausting the rate limit does not block another behind the same proxy', async () => {
  const { default: Fastify } = await import('fastify');
  const { default: rateLimit } = await import('@fastify/rate-limit');

  const app = Fastify({ logger: false });
  await app.register(rateLimit, { max: 2, timeWindow: '1 minute', keyGenerator: clientIp });
  app.get('/ping', async () => 'ok');
  await app.ready();

  const hit = (cf: string) =>
    app.inject({
      method: 'GET',
      url: '/ping',
      remoteAddress: '172.18.0.1',
      headers: { 'cf-connecting-ip': cf },
    });

  assert.equal((await hit('203.0.113.7')).statusCode, 200);
  assert.equal((await hit('203.0.113.7')).statusCode, 200);
  assert.equal((await hit('203.0.113.7')).statusCode, 429);
  assert.equal((await hit('203.0.113.8')).statusCode, 200);

  await app.close();
});
