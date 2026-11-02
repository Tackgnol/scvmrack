import assert from 'node:assert/strict';
import test from 'node:test';
import Ajv from 'ajv';
import { PARTY_NAME_MAX_LENGTH } from '../../src/config/party.js';
import { CreatePartyBodySchema, PromotePartyBodySchema, RenamePartyBodySchema } from '../../src/schemas/party.js';

test('all party HTTP writes enforce the approved 100-character name limit', () => {
  assert.equal(PARTY_NAME_MAX_LENGTH, 100);
  for (const schema of [CreatePartyBodySchema, PromotePartyBodySchema, RenamePartyBodySchema]) {
    const validate = new Ajv().compile(schema);
    const body = schema === PromotePartyBodySchema ? { obrRoomId: 'room' } : {};
    assert.equal(validate({ ...body, name: 'a'.repeat(PARTY_NAME_MAX_LENGTH) }), true);
    assert.equal(validate({ ...body, name: 'a'.repeat(PARTY_NAME_MAX_LENGTH + 1) }), false);
  }
});
