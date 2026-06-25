import { renderHook } from '@testing-library/react';
import { expect, test } from 'vitest';
import { useSummaryMetrics } from '../../../src/hooks/useSummaryMetrics.ts';

test('useSummaryMetrics applies stat and context-specific modifier breakdowns', () => {
  const { result } = renderHook(() =>
    useSummaryMetrics({
      id: 'char-1',
      agility: 13,
      strength: 7,
      presence: 10,
      equipment: [{ key: 'rope', name: 'Rope' }],
      computedModifiers: [
        {
          originKey: 'armor-1',
          statistic: 'agility',
          value: -1,
        },
      ],
      modifiers: [
        {
          id: 'm1',
          statistic: 'agility',
          value: 2,
          exclude: ['defence'],
        },
        {
          id: 'm2',
          statistic: 'strength',
          value: 1,
        },
      ],
    }),
  );

  expect(result.current.characterKey).toBe('char-1');
  expect(result.current.agilityModifier).toBe(1);
  expect(result.current.strengthModifier).toBe(-1);
  expect(result.current.presenceModifier).toBe(0);

  expect(result.current.dodgeBreakdown.applicable).toHaveLength(1);
  expect(result.current.dodgeBreakdown.modifierTotal).toBe(-1);
  expect(result.current.meleeBreakdown.modifierTotal).toBe(1);
  expect(result.current.rangedBreakdown.modifierTotal).toBe(0);

  expect(result.current.toDodge).toBe(12);
  expect(result.current.toHitMelee).toBe(12);
  expect(result.current.toHitRanged).toBe(12);
});

test('useSummaryMetrics uses explicit DR and encumbrance values when provided', () => {
  const { result } = renderHook(() =>
    useSummaryMetrics({
      drToDodge: 8,
      drToMelee: 9,
      drToRanged: 10,
      strength: 13,
      equipment: [{ key: '1' }, { key: '2' }],
      equippedWeapons: [{ key: '3' }],
      equippedArmor: { key: '4' },
    }),
  );

  expect(result.current.toDodge).toBe(8);
  expect(result.current.toHitMelee).toBe(9);
  expect(result.current.toHitRanged).toBe(10);
  expect(result.current.encumbrance).toBe(4);
  expect(result.current.maxEncumbrance).toBe(9);
});

test('useSummaryMetrics counts equipped weapons and armor toward encumbrance', () => {
  const { result } = renderHook(() =>
    useSummaryMetrics({
      equipment: [{ key: 'rope', name: 'Rope' }],
      equippedWeapons: [
        { key: 'dagger', name: 'Dagger' },
        null as any,
        { key: 'shield', name: 'Shield' },
      ],
      equippedArmor: { key: 'leather', name: 'Leather Armor' },
    }),
  );

  expect(result.current.encumbrance).toBe(4);
  expect(result.current.encumbranceItems.map((item) => item.key)).toEqual([
    'rope',
    'dagger',
    'shield',
    'leather',
  ]);
});

test('useSummaryMetrics excludes ammo, pets, and carry items from encumbrance', () => {
  const { result } = renderHook(() =>
    useSummaryMetrics({
      equipment: [
        { key: 'equipment.rope', name: 'Rope', tags: ['tool'] },
        { key: 'equipment.arrows', name: 'Arrows', tags: ['ammo'] },
        { key: 'equipment.bolts', name: 'Bolts', tags: ['ammo'] },
        { key: 'equipment.backpack', name: 'Backpack', tags: ['carry'] },
        { key: 'equipment.donkey', name: 'Donkey', tags: ['carry'] },
        { key: 'pets.hawk', name: 'Hawk', tags: ['pet'] },
      ],
      equippedWeapons: [{ key: 'weapons.bow', name: 'Bow' }],
      equippedArmor: { key: 'armor.leather', name: 'Leather Armor' },
    }),
  );

  expect(result.current.encumbrance).toBe(3);
  expect(result.current.encumbranceItems.map((item) => item.key)).toEqual([
    'equipment.rope',
    'weapons.bow',
    'armor.leather',
  ]);
});

test('useSummaryMetrics prefers the backend-computed encumbrance over the local count', () => {
  const { result } = renderHook(() =>
    useSummaryMetrics({
      // The backend is the source of truth: even though three items would be
      // counted locally, the hydrated encumbrance/maxEncumbrance win so the
      // displayed count agrees with the over-capacity modifier.
      encumbrance: 1,
      maxEncumbrance: 6,
      equipment: [
        { key: 'a', name: 'A' },
        { key: 'b', name: 'B' },
        { key: 'c', name: 'C' },
      ],
    }),
  );

  expect(result.current.encumbrance).toBe(1);
  expect(result.current.maxEncumbrance).toBe(6);
});

test('useSummaryMetrics handles undefined character', () => {
  const { result } = renderHook(() => useSummaryMetrics(undefined));

  expect(result.current.characterKey).toBe('unknown');
  expect(result.current.agilityModifier).toBe(0);
  expect(result.current.toDodge).toBe(12);
  expect(result.current.encumbrance).toBe(0);
  expect(result.current.maxEncumbrance).toBe(8);
});
