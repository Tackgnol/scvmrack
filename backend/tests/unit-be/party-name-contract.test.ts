import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import Ajv from 'ajv';
import { PARTY_NAME_MAX_LENGTH } from '../../src/config/party.js';
import { CreatePartyBodySchema, PromotePartyBodySchema, RenamePartyBodySchema } from '../../src/schemas/party.js';

test('all party HTTP writes and the separately built client share the name limit', () => {
  // Backend CI runs before frontend dependencies are installed.
  const clientSource = readFileSync(new URL('../../../frontend/src/validation/partyName.ts', import.meta.url), 'utf8');
  const clientMax = clientSource.match(/PARTY_NAME_MAX_LENGTH\s*=\s*(\d+)/)?.[1];
  assert.equal(Number(clientMax), PARTY_NAME_MAX_LENGTH);
  for (const schema of [CreatePartyBodySchema, PromotePartyBodySchema, RenamePartyBodySchema]) {
    const validate = new Ajv().compile(schema);
    const body = schema === PromotePartyBodySchema ? { obrRoomId: 'room' } : {};
    assert.equal(validate({ ...body, name: 'a'.repeat(PARTY_NAME_MAX_LENGTH) }), true);
    assert.equal(validate({ ...body, name: 'a'.repeat(PARTY_NAME_MAX_LENGTH + 1) }), false);
  }
});
