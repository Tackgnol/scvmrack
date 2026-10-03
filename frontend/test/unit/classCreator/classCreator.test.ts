import { describe, expect, it } from 'vitest';
import {
  blankDraft,
  draftIssues,
  fieldId,
  formulaText,
  missingCount,
  statRange,
} from '@/components/organisms/class-creator/classCreator.utils';
import { signed } from '@/utils/signed';
import type { ClassDraft } from '@/api/classes';

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
