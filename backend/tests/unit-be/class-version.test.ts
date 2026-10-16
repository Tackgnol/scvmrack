import assert from 'node:assert/strict';
import { test } from 'node:test';

import { blankClassDraft, type ClassDraft } from '../../src/lib/class-draft.ts';
import { blankedContent, draftFromVersion, planVersionWrite, type VersionRow } from '../../src/lib/class-version.ts';
import { CLASSLESS_DEFAULTS } from '../../src/lib/classless-defaults.ts';

const ability = (key: string | undefined, name: string): ClassDraft['abilities'][number] => ({
  ...(key ? { key } : {}),
  random: false,
  name: { en: name, pl: '' },
  text: { en: `${name} text`, pl: '' },
  modifiers: [{ statistic: 'strength', value: 1, exclude: [] }],
  grantItem: null,
  grantPet: null,
  table: null,
});

test('a save keeps saved keys, gives new entries unused ones, and replaces only the keys it writes', () => {
  const draft: ClassDraft = {
    ...blankClassDraft(),
    name: { en: 'Witch', pl: '' },
    abilities: [ability('cc.7.ability.2', 'Kept'), ability(undefined, 'New')],
  };
  // ability.1 was removed from the draft, but a character that rolled it still reads its text and modifiers.
  const plan = planVersionWrite(7, draft, {
    textKeys: ['cc.7.ability.1', 'cc.7.ability.2'],
    modifierAbilityKeys: ['cc.7.ability.1', 'cc.7.ability.2'],
    itemKeys: [],
  });

  assert.deepEqual(plan.abilities.map((a) => a.key), ['cc.7.ability.2', 'cc.7.ability.3']);
  assert.deepEqual(plan.replaced.modifierAbilityKeys, ['cc.7.ability.2', 'cc.7.ability.3']);
  assert.ok(!plan.replaced.textKeys.includes('cc.7.ability.1'), 'a removed ability keeps its text');
  assert.ok(plan.replaced.textKeys.includes('cc.7.getting_better_note'), 'a cleared note is always replaced');
  assert.equal(plan.columns.gettingBetterNoteKey, null);
  assert.equal(plan.abilities[0].modifiers[0].source, 'Kept');
});

test('a version saved without dice reads back with the classless defaults', () => {
  const cls = {
    id: 7,
    languages: ['en'],
    nameKey: null,
    descriptionKey: null,
    statDice: {},
    hpDie: null,
    omenDie: 2,
    weaponDie: null,
    armorDie: null,
    silverDice: [],
    silverModifier: null,
    randomAbilityCount: null,
    gettingBetterRule: 'standard',
    gettingBetterNoteKey: null,
  } as unknown as VersionRow;
  const draft = draftFromVersion(cls, { origins: [], abilities: [], modifiers: [], translations: [], items: [], itemTexts: [] });

  assert.equal(draft.hpDie, CLASSLESS_DEFAULTS.hpDie);
  assert.equal(draft.weaponDie, CLASSLESS_DEFAULTS.weaponDie);
  assert.equal(draft.silver.count, CLASSLESS_DEFAULTS.silverDice.length);
  assert.equal(draft.silver.multiplier, CLASSLESS_DEFAULTS.silverModifier);
  assert.equal(draft.randomAbilityCount, 0);
});

test('a removal blanks every user-written string but keeps the name column and the modifiers themselves', () => {
  const blanked = blankedContent(
    {
      versions: [
        {
          id: 7,
          name: 'Witch',
          appendix: 'Notes',
          translations: [{ locale: 'en', key: 'cc.7.name', value: 'Witch' }],
          modifiers: [{ id: 1, source: 'Grip' }],
          items: [{ table: 'weapon', key: 'weapon.cc-7-1', modifiers: [{ source: 'Hook', statistic: 'agility' }] }],
        },
      ],
    },
    'X'
  );
  const [version] = blanked.versions;

  assert.equal(version.name, 'Witch');
  assert.equal(version.appendix, 'X');
  assert.equal(version.translations[0].value, 'X');
  assert.equal(version.modifiers[0].source, 'X');
  assert.deepEqual(version.items?.[0].modifiers, [{ source: 'X', statistic: 'agility' }]);
});
