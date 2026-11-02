import assert from 'node:assert/strict';
import test from 'node:test';
import Ajv from 'ajv';
import { UpdateBodySchema } from '../../src/schemas/character.js';
import { sanitizeCharacterUpdate } from '../../src/utils.js';

const stats = ['strength', 'agility', 'presence', 'toughness'] as const;
const validate = new Ajv({ strict: false, formats: { 'date-time': true } }).compile(UpdateBodySchema);
for (const stat of stats) {
  test(`${stat} writes reject scores outside 1–21 and the service backstop clamps them`, () => {
    assert.equal(validate({ [stat]: 1 }), true);
    assert.equal(validate({ [stat]: 21 }), true);
    assert.equal(validate({ [stat]: 22 }), false);
    assert.equal(validate({ [stat]: 0 }), false);
    assert.equal(sanitizeCharacterUpdate({ [stat]: 30 })[stat], 21);
    assert.equal(sanitizeCharacterUpdate({ [stat]: -4 })[stat], 1);
  });
}
