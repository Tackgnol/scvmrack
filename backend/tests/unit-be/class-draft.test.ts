import assert from 'node:assert/strict';
import test from 'node:test';

import {
  blankClassDraft,
  classDraftProblems,
  classSpecFromDraft,
  type ClassDraft,
} from '../../src/lib/class-draft.ts';

const ready = (overrides: Partial<ClassDraft> = {}): ClassDraft => ({
  ...blankClassDraft(),
  languages: ['en'],
  name: { en: 'Pale Ossuary Keeper', pl: '' },
  description: { en: 'Swept the bone-halls.', pl: '' },
  origins: [{ en: 'The Shunned Chapel', pl: '' }],
  ...overrides,
});

test('a blank draft rolls like the book: 3d6 stats, d8 HP, 2d6 × 10 silver', () => {
  const draft = blankClassDraft();
  assert.deepEqual(draft.stats.strength, { count: 3, faces: 6, modifier: 0, dropLowest: false });
  assert.deepEqual(draft.silver, { count: 2, faces: 6, multiplier: 10 });
  assert.equal(draft.hpDie, 8);
  assert.equal(draft.gettingBetterRule, 'book');
});

test('a complete one-language draft has no problems', () => {
  assert.deepEqual(classDraftProblems(ready()), []);
});

test('every text field needs each of the class languages', () => {
  const problems = classDraftProblems(
    ready({ languages: ['en', 'pl'], origins: [{ en: 'Chapel', pl: 'Kaplica' }, { en: 'Pit', pl: ' ' }] })
  );
  assert.deepEqual(problems, [
    'Polish missing: class name',
    'Polish missing: class description',
    'Polish missing: origin 2',
  ]);
});

test('a class needs an origin, and Specialist needs a bigger random pool than it rolls', () => {
  assert.deepEqual(classDraftProblems(ready({ origins: [], gettingBetterRule: 'specialist' })), [
    'Add at least one origin',
    'Specialist needs at least one more random ability than each scvm rolls',
  ]);
});

test('a draft becomes the class spec the generator rolls from', () => {
  const spec = classSpecFromDraft(
    ready({ silver: { count: 3, faces: 4, multiplier: 5 }, hpDie: 6, omenDie: 4 }),
    'en'
  );
  assert.deepEqual(spec.silverDice, [4, 4, 4]);
  assert.equal(spec.silverModifier, 5);
  assert.equal(spec.hpDie, 6);
  assert.equal(spec.omenDie, 4);
  assert.deepEqual(spec.originKeys, ['The Shunned Chapel']);
  assert.deepEqual(spec.abilities, []);
});

test('whitespace is not text, and a single die cannot drop its lowest', () => {
  const draft = ready({ origins: [{ en: '   ', pl: '' }] });
  draft.stats.agility = { count: 1, faces: 6, modifier: 0, dropLowest: true };
  assert.deepEqual(classDraftProblems(draft), [
    'English missing: origin 1',
    'agility can drop its lowest die only when it rolls two or more',
  ]);
});
