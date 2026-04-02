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
      encumbrance: 5,
      maxEncumbrance: 9,
      equipment: [{ key: '1' }, { key: '2' }],
    }),
  );

  expect(result.current.toDodge).toBe(8);
  expect(result.current.toHitMelee).toBe(9);
  expect(result.current.toHitRanged).toBe(10);
  expect(result.current.encumbrance).toBe(5);
  expect(result.current.maxEncumbrance).toBe(9);
});

test('useSummaryMetrics handles undefined character', () => {
  const { result } = renderHook(() => useSummaryMetrics(undefined));

  expect(result.current.characterKey).toBe('unknown');
  expect(result.current.agilityModifier).toBe(0);
  expect(result.current.toDodge).toBe(12);
  expect(result.current.encumbrance).toBe(0);
  expect(result.current.maxEncumbrance).toBe(8);
});
