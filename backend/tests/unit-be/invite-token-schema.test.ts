import assert from 'node:assert/strict';
import test from 'node:test';
import Ajv from 'ajv';
import { InviteLocaleQuerySchema } from '../../src/schemas/character.ts';
import { InviteTokenParamsSchema, JoinPartyBodySchema } from '../../src/schemas/party.ts';

const ajv = new Ajv({ strict: false });

test('invite tokens in the query reject a null byte and keep normal tokens', () => {
  const validate = ajv.compile(InviteLocaleQuerySchema);
  assert.equal(validate({ invite: 'abc' }), true, JSON.stringify(validate.errors));
  assert.equal(validate({ invite: 'a\u0000b' }), false);
  assert.equal(validate({ invite: '\u0000' }), false);
});

test('invite tokens in params reject a null byte', () => {
  const validate = ajv.compile(InviteTokenParamsSchema);
  assert.equal(validate({ token: 'abc' }), true, JSON.stringify(validate.errors));
  assert.equal(validate({ token: 'a\u0000b' }), false);
});

test('join party body token rejects a null byte', () => {
  const validate = ajv.compile(JoinPartyBodySchema);
  const characterId = '00000000-0000-4000-8000-000000000000';
  assert.equal(validate({ token: 'abc', characterId }), true, JSON.stringify(validate.errors));
  assert.equal(validate({ token: 'a\u0000b', characterId }), false);
});
