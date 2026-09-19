import assert from 'node:assert/strict';
import test from 'node:test';

import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { clientIp } from '@tackgnol/rpgtools-shared-auth';

// Behind Cloudflare -> Caddy -> Docker every request reaches the container from
// the Docker gateway. shared-auth's clientIp must give each visitor their own bucket.
test('one visitor exhausting the rate limit does not block another behind the same proxy', async () => {
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
