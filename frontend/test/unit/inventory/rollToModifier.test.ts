import { describe, expect, test } from 'vitest';

import { rollToModifier } from '../../../src/inventory/customItems';

// Pinned truth table from the SQL function in
// backend/init/03-functions/dice_and_utils.sql (`roll_to_modifier`).
//
// Any change to this table MUST be made in lock-step with the SQL ladder.
// The TS port is kept around purely so consumable pip counts can be previewed
// before save — server stays the source of truth for derived modifiers.
const SQL_LADDER: Array<{ score: number; expected: number }> = [
  // Lower bound of the ≤ 4 band
  { score: -5, expected: -3 },
  { score: 0, expected: -3 },
  { score: 4, expected: -3 },
  // ≤ 6
  { score: 5, expected: -2 },
  { score: 6, expected: -2 },
  // ≤ 8
  { score: 7, expected: -1 },
  { score: 8, expected: -1 },
  // ≤ 12
  { score: 9, expected: 0 },
  { score: 10, expected: 0 },
  { score: 12, expected: 0 },
  // ≤ 14
  { score: 13, expected: 1 },
  { score: 14, expected: 1 },
  // ≤ 16
  { score: 15, expected: 2 },
  { score: 16, expected: 2 },
  // else
  { score: 17, expected: 3 },
  { score: 30, expected: 3 },
];

describe('rollToModifier JS↔SQL parity', () => {
  test.each(SQL_LADDER)(
    'score $score → $expected',
    ({ score, expected }) => {
      expect(rollToModifier(score)).toBe(expected);
    },
  );

  test('non-finite input defaults to a presence of 10 (band 0)', () => {
    expect(rollToModifier(undefined)).toBe(0);
    expect(rollToModifier(Number.NaN)).toBe(0);
    expect(rollToModifier(Infinity)).toBe(0);
  });
});
