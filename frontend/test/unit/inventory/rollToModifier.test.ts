import { describe, expect, test } from 'vitest';

import { statToModifier } from '../../../src/utils/stats';

// Pinned truth table shared with the backend stat modifier helper.
//
// The TS port is kept around purely so consumable pip counts can be previewed
// before save — server stays the source of truth for derived modifiers.
const MODIFIER_LADDER: Array<{ score: number; expected: number }> = [
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
  // ≤ 18
  { score: 17, expected: 3 },
  { score: 18, expected: 3 },
  // ≤ 19
  { score: 19, expected: 4 },
  // ≤ 20
  { score: 20, expected: 5 },
  // 21+
  { score: 21, expected: 6 },
  { score: 30, expected: 6 },
];

describe('statToModifier parity', () => {
  test.each(MODIFIER_LADDER)(
    'score $score → $expected',
    ({ score, expected }) => {
      expect(statToModifier(score)).toBe(expected);
    },
  );

  test('non-finite input defaults to a presence of 10 (band 0)', () => {
    expect(statToModifier(undefined)).toBe(0);
    expect(statToModifier(Number.NaN)).toBe(0);
    expect(statToModifier(Infinity)).toBe(0);
  });
});
