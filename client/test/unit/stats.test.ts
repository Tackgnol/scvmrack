import { expect, test } from 'vitest';

import { statToModifier } from '../../src/utils/stats.ts';

test('statToModifier maps full threshold table', () => {
  const cases: Array<[number, number]> = [
    [1, -3],
    [4, -3],
    [5, -2],
    [6, -2],
    [7, -1],
    [8, -1],
    [9, 0],
    [12, 0],
    [13, 1],
    [14, 1],
    [15, 2],
    [16, 2],
    [17, 3],
    [99, 3],
  ];

  for (const [input, expected] of cases) {
    expect(statToModifier(input)).toBe(expected);
  }
});
