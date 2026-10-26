import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import Fastify from 'fastify';
import AutoLoad from '@fastify/autoload';
import swagger from '@fastify/swagger';

test('CATS read endpoints document validation failures and successful response bodies', async (t) => {
  // Route registration only; this address cannot reach a database.
  process.env.DATABASE_URL = 'postgresql://contract:unused@127.0.0.1:1/contracts';
  const app = Fastify({ logger: false });
  t.after(() => app.close());
  await app.register(swagger, { openapi: { info: { title: 'Contracts', version: 'test' } } });
  await app.register(AutoLoad, {
    dir: fileURLToPath(new URL('../../src/routes', import.meta.url)),
    options: { prefix: '/api' },
  });
  await app.ready();
  const paths = app.swagger().paths!;
  for (const path of ['/api/characters/classes', '/api/classes/details/{id}']) {
    assert.ok(paths[path]?.get?.responses?.['400'], `${path} documents invalid input`);
  }
  for (const path of ['/api/health', '/api/equipment/{itemType}/{id}', '/api/obr/rooms/{roomId}/bindings']) {
    const response = paths[path]?.get?.responses?.['200'];
    assert.ok(response && 'content' in response, `${path} documents its response body`);
    const schema = response.content?.['application/json']?.schema;
    assert.ok(schema && !('$ref' in schema) && ('properties' in schema || 'anyOf' in schema), `${path} describes its fields`);
  }
  const health = await app.inject('/api/health');
  assert.equal(health.statusCode, 200);
  assert.equal(health.json().status, 'ok');
  assert.ok(!Number.isNaN(Date.parse(health.json().timestamp)));
});
