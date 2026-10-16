import type { TFunction } from 'i18next';
import { describe, expect, it } from 'vitest';
import type { ClassPoolView, PoolClass } from '@/api/classPool';
import { attributionText, poolSections, poolTally } from '@/components/organisms/class-pool/classPool.utils';
import { applyPoolSwitch } from '@/hooks/useClassPool';

const cls = (lineageId: string, overrides: Partial<PoolClass> = {}): PoolClass => ({
  lineageId,
  classId: 1,
  group: 'book',
  name: lineageId,
  blurb: null,
  languages: ['en', 'pl'],
  attribution: null,
  abilityCount: 7,
  randomAbilityCount: 1,
  classItemCount: 0,
  gettingBetterRule: 'book',
  version: 1,
  playingHere: 0,
  enabled: true,
  ...overrides,
});

const classes = [
  cls('Fanged Deserter'),
  cls('Esoteric Hermit', { enabled: false }),
  cls('Ossuary Knight', {
    group: 'zine',
    languages: ['en'],
    attribution: { kind: 'credit', work: 'Terrible Dungeons', author: 'Toby', url: null },
  }),
  cls('Carrion Saint', {
    group: 'public',
    languages: ['pl'],
    enabled: false,
    attribution: { kind: 'owner', name: 'Morbid Marta', private: false },
  }),
];
const all = { text: '', filter: 'all', language: 'any' } as const;

describe('poolSections', () => {
  it('groups classes in source order with on/total per group', () => {
    expect(
      poolSections(classes, all).map((s) => [s.group, s.on, s.total, s.shown.length]),
    ).toEqual([
      ['book', 1, 2, 2],
      ['zine', 1, 1, 1],
      ['public', 0, 1, 1],
    ]);
  });

  it('filters by source, language and text across names and authors', () => {
    expect(poolSections(classes, { ...all, filter: 'zr' }).map((s) => s.group)).toEqual(['zine']);
    expect(poolSections(classes, { ...all, language: 'pl' }).map((s) => s.group)).toEqual([
      'book',
      'public',
    ]);
    const marta = poolSections(classes, { ...all, text: ' marta ' });
    expect(marta.map((s) => s.shown.map((c) => c.name))).toEqual([['Carrion Saint']]);
    // a group's on/total ignores the search
    expect(poolSections(classes, { ...all, text: 'hermit' })[0]).toMatchObject({ on: 1, total: 2 });
  });
});

describe('attributionText', () => {
  const t = ((_: string, fallback: string) => fallback) as unknown as TFunction;

  it('credits a public class without an owner as created by a former GM', () => {
    expect(
      attributionText(
        t,
        cls('former-gm', {
          group: 'public',
          attribution: { kind: 'owner', name: null, private: false },
        }),
      ),
    ).toBe('created by a former GM');
  });
});
describe('poolTally', () => {
  it('counts switched-on classes per group, leaving empty groups out', () => {
    expect(poolTally(classes)).toEqual([
      ['book', 1],
      ['zine', 1],
    ]);
  });
});

describe('applyPoolSwitch', () => {
  const view: ClassPoolView = {
    classlessEnabled: true,
    classes,
    removed: [{ lineageId: 'gone', name: 'Gone', by: 'Marta', reason: 'archived' }],
  };

  it('switches one class and leaves the rest alone', () => {
    const next = applyPoolSwitch(view, { kind: 'class', lineageId: 'Esoteric Hermit', name: 'Esoteric Hermit', enabled: true });
    expect(next.classes.map((c) => c.enabled)).toEqual([true, true, true, false]);
  });

  it('drops a removed notice once its class is switched off', () => {
    expect(applyPoolSwitch(view, { kind: 'class', lineageId: 'gone', name: 'Gone', enabled: false }).removed).toEqual([]);
  });

  it('switches Classless', () => {
    expect(applyPoolSwitch(view, { kind: 'classless', enabled: false }).classlessEnabled).toBe(false);
  });
});
