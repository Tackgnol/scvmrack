import assert from 'node:assert/strict';
import test from 'node:test';

import {
  blankClassDraft,
  classDraftProblems,
  classSpecFromDraft,
  blankClassItem,
  type AbilityDraft,
  type ClassDraft,
  type ClassItemDraft,
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
  assert.deepEqual(draft.stats.strength, {
    count: 3,
    faces: 6,
    modifier: 0,
    dropLowest: false,
  });
  assert.deepEqual(draft.silver, { count: 2, faces: 6, multiplier: 10 });
  assert.equal(draft.hpDie, 8);
  assert.equal(draft.gettingBetterRule, 'book');
});

test('a complete one-language draft has no problems', () => {
  assert.deepEqual(classDraftProblems(ready()), []);
});

test('every text field needs each of the class languages', () => {
  const problems = classDraftProblems(
    ready({
      languages: ['en', 'pl'],
      origins: [
        { en: 'Chapel', pl: 'Kaplica' },
        { en: 'Pit', pl: ' ' },
      ],
    })
  );
  assert.deepEqual(problems, [
    'Polish missing: class name',
    'Polish missing: class description',
    'Polish missing: origin 2',
  ]);
});

test('a class needs an origin, and Specialist needs a random pool', () => {
  assert.deepEqual(
    classDraftProblems(ready({ origins: [], gettingBetterRule: 'specialist' })),
    [
      'Add at least one origin',
      'Specialist needs at least one more random ability than each scvm rolls',
    ]
  );
});

test('a draft becomes the class spec the generator rolls from', () => {
  const spec = classSpecFromDraft(
    ready({
      silver: { count: 3, faces: 4, multiplier: 5 },
      hpDie: 6,
      omenDie: 4,
    }),
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

const ability = (
  name: string,
  random: boolean,
  overrides: Partial<AbilityDraft> = {}
): AbilityDraft => ({
  random,
  name: { en: name, pl: '' },
  text: { en: `${name} rules.`, pl: '' },
  modifiers: [],
  grantItem: null,
  grantPet: null,
  ...overrides,
});

test('abilities need their name and rules text in each language, and the rolled count fits the pool', () => {
  const draft = ready({
    abilities: [
      ability('Bone-Reader', false),
      ability('', true, { text: { en: '', pl: '' } }),
    ],
    randomAbilityCount: 2,
  });
  assert.deepEqual(classDraftProblems(draft), [
    'English missing: ability 2 name',
    'English missing: ability 2 rules text',
    'Rolls 2 random abilities, but the pool has 1',
  ]);
});

test('Specialist needs one more random ability than each scvm rolls', () => {
  const pool = [ability('A', true), ability('B', true)];
  assert.deepEqual(
    classDraftProblems(
      ready({
        abilities: pool,
        randomAbilityCount: 1,
        gettingBetterRule: 'specialist',
      })
    ),
    []
  );
  assert.deepEqual(
    classDraftProblems(
      ready({
        abilities: pool,
        randomAbilityCount: 2,
        gettingBetterRule: 'specialist',
      })
    ),
    ['Specialist needs at least one more random ability than each scvm rolls']
  );
});

test('an ability cannot carry the same modifier twice', () => {
  const twice = {
    statistic: 'presence' as const,
    value: 2,
    exclude: ['melee'],
  };
  assert.deepEqual(
    classDraftProblems(
      ready({
        abilities: [
          ability('Grave Sense', false, {
            modifiers: [twice, { ...twice, exclude: ['melee'] }],
          }),
        ],
      })
    ),
    ['Ability “Grave Sense” has the same modifier twice']
  );
});

test('the spec rolls fixed and random abilities by their text, in order', () => {
  const spec = classSpecFromDraft(
    ready({
      abilities: [ability('Bone-Reader', false), ability('Grave Sense', true)],
      randomAbilityCount: 1,
    }),
    'en'
  );
  assert.deepEqual(
    spec.abilities.map((a) => [a.key, a.isRandom, a.position]),
    [
      ['Bone-Reader', false, 0],
      ['Grave Sense', true, 1],
    ]
  );
  assert.equal(spec.randomAbilityCount, 1);
});

const item = (
  ref: string,
  type: ClassItemDraft['type'],
  name: string
): ClassItemDraft => ({
  ...blankClassItem(type),
  ref,
  name: { en: name, pl: '' },
});

test('every Class Item is granted by exactly one ability, from the right slot', () => {
  const flail = item('new:flail', 'weapon', 'Reliquary Flail');
  const crow = item('new:crow', 'pet', 'Carrion Crow');
  const salt = item('new:salt', 'gear', 'Grave-Salt');
  const draft = ready({
    items: [flail, crow, salt],
    abilities: [
      ability('Flail', false, { grantItem: 'new:flail', grantPet: null }),
      ability('Crow', false, { grantItem: 'new:crow', grantPet: null }),
      ability('Twin', false, { grantItem: 'new:flail', grantPet: null }),
    ],
  });
  assert.deepEqual(classDraftProblems(draft), [
    'Ability “Crow” holds the pet “Carrion Crow” in its item slot',
    'Class Item “Reliquary Flail” is granted by more than one ability',
    'Class Item “Carrion Crow” is not granted by any ability',
    'Class Item “Grave-Salt” is not granted by any ability',
  ]);
});

test('a grant must point at one of the class items', () => {
  assert.deepEqual(
    classDraftProblems(
      ready({
        abilities: [
          ability('Ghost', false, { grantItem: 'new:gone', grantPet: null }),
        ],
      })
    ),
    ['Ability “Ghost” grants an item that is not in this class']
  );
});

test('Class Items cannot share one reference', () => {
  const flail = item('new:relic', 'weapon', 'Reliquary Flail');
  const salt = item('new:relic', 'gear', 'Grave-Salt');
  assert.deepEqual(
    classDraftProblems(
      ready({
        items: [flail, salt],
        abilities: [ability('Relic', false, { grantItem: 'new:relic' })],
      })
    ),
    ['Class Item “Grave-Salt” has the same reference as another Class Item']
  );
});
test('Class Items need their name in each language', () => {
  assert.deepEqual(
    classDraftProblems(
      ready({
        items: [item('new:a', 'armor', '')],
        abilities: [
          ability('Plate', false, { grantItem: 'new:a', grantPet: null }),
        ],
      })
    ),
    ['English missing: Class Item 1 name']
  );
});

test('the test roll grants Class Items by their name', () => {
  const spec = classSpecFromDraft(
    ready({
      items: [item('new:flail', 'weapon', 'Reliquary Flail')],
      abilities: [
        ability('Flail', false, { grantItem: 'new:flail', grantPet: null }),
      ],
    }),
    'en'
  );
  assert.equal(spec.abilities[0].grantItemKey, 'Reliquary Flail');
});
