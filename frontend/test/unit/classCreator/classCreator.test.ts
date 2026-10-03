import { describe, expect, it } from 'vitest';
import { scopeOfExclude, scopeToExclude } from '@/components/modifiers/utils';
import {
  abilityIndexOf,
  scopeExclude,
  withSavedKeys,
  blankDraft,
  randomNumber,
  specialistAllowed,
  STEPS,
  draftIssues,
  fieldId,
  formulaText,
  missingCount,
  statRange,
} from '@/components/organisms/class-creator/classCreator.utils';
import { signed } from '@/utils/signed';
import type { AbilityDraft, ClassDraft } from '@/api/classes';

const ready = (overrides: Partial<ClassDraft> = {}): ClassDraft => ({
  ...blankDraft(),
  name: { en: 'Bog Witch', pl: '' },
  description: { en: 'The mire keeps what you give it.', pl: '' },
  origins: [{ en: 'A drowned village', pl: '' }],
  ...overrides,
});

describe('formulaText', () => {
  it('writes stat dice in book notation with a true minus', () => {
    expect(formulaText({ count: 3, faces: 6, modifier: -1, dropLowest: false })).toBe('3d6 −1');
    expect(formulaText({ count: 4, faces: 6, modifier: 0, dropLowest: true })).toBe('best 3 of 4d6');
    expect(formulaText({ count: 1, faces: 8, modifier: 2, dropLowest: true })).toBe('1d8 +2');
  });
});

describe('statRange', () => {
  it('gives the score and modifier range', () => {
    expect(statRange({ count: 3, faces: 6, modifier: -1, dropLowest: false })).toEqual({
      low: 2,
      high: 17,
      modLow: -3,
      modHigh: 3,
    });
    expect(statRange({ count: 4, faces: 6, modifier: 0, dropLowest: true })).toEqual({
      low: 3,
      high: 18,
      modLow: -3,
      modHigh: 3,
    });
  });
});

describe('signed', () => {
  it('signs numbers with a true minus', () => {
    expect([signed(-2), signed(0), signed(3)]).toEqual(['−2', '0', '+3']);
  });
});

describe('draftIssues', () => {
  it('is empty for a complete draft', () => {
    expect(draftIssues(ready())).toEqual([]);
  });

  it('knows the step, language and field of every missing text', () => {
    const issues = draftIssues(
      ready({ languages: ['en', 'pl'], origins: [{ en: 'Pit', pl: '' }] }),
    );
    expect(issues.map((i) => [i.step, i.language, i.path])).toEqual([
      ['identity', 'pl', 'name.pl'],
      ['identity', 'pl', 'description.pl'],
      ['origins', 'pl', 'origins.0.pl'],
    ]);
    expect(missingCount(issues, 'pl', 'identity')).toBe(2);
    expect(missingCount(issues, 'pl')).toBe(3);
    expect(missingCount(issues, 'en')).toBe(0);
  });

  it('asks for an origin and refuses Specialist without a random pool', () => {
    expect(
      draftIssues(ready({ origins: [], gettingBetterRule: 'specialist' })).map((i) => [i.key, i.path]),
    ).toEqual([
      ['creator.issues.noOrigin', 'origins.add'],
      ['creator.issues.specialistPool', 'gettingBetterRule'],
    ]);
  });
});

describe('fieldId', () => {
  it('turns a draft path into an element id', () => {
    expect(fieldId('origins.2.pl')).toBe('cc-origins-2-pl');
  });
});

describe('abilities in the draft', () => {
  const ability = (name: string, random: boolean): AbilityDraft => ({
    random,
    name: { en: name, pl: '' },
    text: { en: `${name} rules.`, pl: '' },
    modifiers: [],
  });

  it('puts the Abilities step between Stats & dice and Origins', () => {
    expect(STEPS).toEqual(['identity', 'stats', 'abilities', 'origins', 'gettingBetter', 'review']);
  });

  it('finds missing ability text by field, and a rolled count bigger than the pool', () => {
    const issues = draftIssues(
      ready({ abilities: [ability('Bone-Reader', false), { ...ability('', true), text: { en: '', pl: '' } }], randomAbilityCount: 2 }),
    );
    expect(issues.map((i) => [i.key, i.step, i.path])).toEqual([
      ['creator.issues.missingAbilityName', 'abilities', 'abilities.1.name.en'],
      ['creator.issues.missingAbilityTextUnnamed', 'abilities', 'abilities.1.text.en'],
      ['creator.issues.poolTooSmall', 'abilities', 'randomAbilityCount'],
    ]);
  });

  it('lets Specialist through once the pool beats the rolled count', () => {
    const pool = [ability('A', true), ability('B', true)];
    expect(draftIssues(ready({ abilities: pool, randomAbilityCount: 1, gettingBetterRule: 'specialist' }))).toEqual([]);
    expect(specialistAllowed(ready({ abilities: pool, randomAbilityCount: 2 }))).toBe(false);
  });

  it('numbers random abilities in pool order', () => {
    const draft = ready({ abilities: [ability('A', true), ability('B', false), ability('C', true)] });
    expect(draft.abilities.map((_, i) => randomNumber(draft, i))).toEqual([1, null, 2]);
  });

  it('turns an ability path into the card that holds it', () => {
    expect(abilityIndexOf('abilities.3.name.pl')).toBe(3);
    expect(abilityIndexOf('origins.0.en')).toBeNull();
  });
});

describe('review fixes', () => {
  const tests = { statistic: 'presence' as const, value: 2, exclude: scopeExclude('tests') };

  it('flags the same modifier twice on one ability, at the second one', () => {
    const issues = draftIssues(
      ready({
        abilities: [{ random: false, name: { en: 'Grave Sense', pl: '' }, text: { en: 'x', pl: '' }, modifiers: [tests, { ...tests }] }],
      }),
    );
    expect(issues.map((i) => [i.key, i.path])).toEqual([['creator.issues.duplicateModifier', 'abilities.0.modifiers.1.statistic']]);
  });

  it('takes the keys a save gave new entries, without touching keyed ones', () => {
    const current = ready({
      origins: [{ en: 'Pit', pl: '' }, { en: 'Bog', pl: '', key: 'cc.1.origin.9' }],
    });
    const saved = ready({
      origins: [{ en: 'Pit', pl: '', key: 'cc.1.origin.1' }, { en: 'Bog', pl: '', key: 'cc.1.origin.2' }],
    });
    expect(withSavedKeys(current, saved).origins.map((o) => o.key)).toEqual(['cc.1.origin.1', 'cc.1.origin.9']);
  });
});

describe('modifier scopes saved before tests, healing, buffs and item use existed', () => {
  it('still read as the preset they were saved with', () => {
    expect(scopeOfExclude(['ranged', 'defence', 'cast', 'ability'])).toBe('melee');
    expect(scopeOfExclude(['defence', 'ability'])).toBe('combat');
    expect(scopeOfExclude([])).toBe('all');
    expect(scopeOfExclude(scopeToExclude('tests'))).toBe('tests');
  });
});
