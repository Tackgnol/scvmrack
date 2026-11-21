import assert from 'node:assert/strict';
import { test } from 'node:test';
import Fastify from 'fastify';
import { CHARACTER_INTEGER_BOUNDS, CHARACTER_TEXT_BOUNDS } from '../../src/lib/character-limits.js';
import { UpdateBodySchema } from '../../src/schemas/character.js';
import { sanitizeCharacterUpdate } from '../../src/utils.js';

/** What a PATCH body becomes: Fastify validates it against the request schema, then the sanitizer runs. */
async function save(body: Record<string, unknown>): Promise<{ status: number; kept?: Record<string, unknown> }> {
  const app = Fastify();
  app.patch('/', { schema: { body: UpdateBodySchema } }, async (request) =>
    sanitizeCharacterUpdate(request.body as Record<string, unknown>)
  );
  const response = await app.inject({ method: 'PATCH', url: '/', payload: body });
  await app.close();
  return response.statusCode === 200
    ? { status: 200, kept: response.json() }
    : { status: response.statusCode };
}

const textFields = Object.entries(CHARACTER_TEXT_BOUNDS);
const integerFields = Object.entries(CHARACTER_INTEGER_BOUNDS);

test('every bounded update field is bounded by the one declaration, and no other is', () => {
  const properties: Record<string, Record<string, unknown>> = UpdateBodySchema.properties;
  const schemaText = Object.keys(properties).filter((key) => properties[key].type === 'string' && 'maxLength' in properties[key]);
  const schemaIntegers = Object.keys(properties).filter((key) => properties[key].type === 'integer');
  assert.deepEqual(schemaText.sort(), Object.keys(CHARACTER_TEXT_BOUNDS).sort());
  assert.deepEqual(schemaIntegers.sort(), Object.keys(CHARACTER_INTEGER_BOUNDS).sort());
});

test('the sanitizer never keeps more text than the request accepts, nor more than a VarChar(255) holds', () => {
  for (const [field, { maxLength, storedLength }] of textFields) {
    assert.ok(storedLength <= maxLength, field);
  }
  assert.ok(CHARACTER_TEXT_BOUNDS.name.storedLength <= 255);
  assert.ok(CHARACTER_TEXT_BOUNDS.origin.storedLength <= 255);
});

for (const [field, { maxLength, storedLength }] of textFields) {
  test(`${field}: the longest accepted text is kept up to ${storedLength}; one more is rejected`, async () => {
    const longest = await save({ [field]: 'x'.repeat(maxLength) });
    assert.equal(longest.status, 200);
    assert.equal(longest.kept?.[field], 'x'.repeat(storedLength));
    assert.equal(sanitizeCharacterUpdate({ [field]: 'x'.repeat(maxLength) })[field], 'x'.repeat(storedLength));

    assert.equal((await save({ [field]: 'x'.repeat(maxLength + 1) })).status, 400);
  });
}

test('an origin of 256 to 1000 characters is accepted and cut to the 255 the column holds', async () => {
  for (const length of [255, 256, 999, 1000]) {
    const result = await save({ origin: 'o'.repeat(length) });
    assert.equal(result.status, 200, `${length}`);
    assert.equal(result.kept?.origin, 'o'.repeat(Math.min(length, 255)), `${length}`);
  }
  assert.equal((await save({ origin: 'o'.repeat(1001) })).status, 400);
});

test('an origin is trimmed before it is cut to fit', async () => {
  const result = await save({ origin: `  ${'o'.repeat(300)}  ` });
  assert.equal(result.kept?.origin, 'o'.repeat(255));
});

for (const [field, { min, max }] of integerFields) {
  test(`${field}: ${min} to ${max} is accepted and kept, outside is rejected, and the sanitizer clamps to the same range`, async () => {
    assert.deepEqual(await save({ [field]: min }), { status: 200, kept: { [field]: min } });
    assert.deepEqual(await save({ [field]: max }), { status: 200, kept: { [field]: max } });
    assert.equal((await save({ [field]: min - 1 })).status, 400);
    assert.equal((await save({ [field]: max + 1 })).status, 400);
    assert.equal(sanitizeCharacterUpdate({ [field]: min - 1 })[field], min);
    assert.equal(sanitizeCharacterUpdate({ [field]: max + 1 })[field], max);
  });
}
