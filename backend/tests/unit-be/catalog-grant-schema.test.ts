import assert from 'node:assert/strict';
import test from 'node:test';
import Ajv from 'ajv';
import { ClassDraftBodySchema } from '../../src/schemas/custom-class.ts';
import { blankClassDraft } from '../../src/lib/class-draft.ts';

test('class requests accept shared catalog grants without widening reference-table grants', () => {
  const validate = new Ajv({ strict: false }).compile(ClassDraftBodySchema);
  const draft = { ...blankClassDraft(), abilities: [{
    random: false, name: { en: 'Companion', pl: '' }, text: { en: 'Carry a rope and travel with a dog.', pl: '' },
    modifiers: [], grantItem: 'equipment.rope', grantPet: 'pets.small-dog', table: null,
  }] };
  assert.equal(validate({ draft }), true, JSON.stringify(validate.errors));
  assert.equal(validate({ draft: { ...draft, abilities: [{ ...draft.abilities[0], grantItem: 'https://example.test/item' }] } }), false);
  assert.equal(validate({ draft: { ...draft, abilities: [{ ...draft.abilities[0], table: { die: 2, rows: [
    { text: { en: 'One', pl: '' }, itemRef: 'equipment.rope' },
    { text: { en: 'Two', pl: '' }, itemRef: null },
  ] } }] } }), false);
});
