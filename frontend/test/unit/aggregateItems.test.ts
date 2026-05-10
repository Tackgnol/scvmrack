import { expect, test } from 'vitest';

import { aggregateItems } from '@/utils/aggregateItems.ts';

test('aggregateItems groups by name case-insensitively and tracks indices', () => {
  const input = [
    { name: 'Torch', comments: 'new' },
    { name: 'torch', comments: 'wet' },
    null,
    { name: 'Rope', comments: null },
    { name: 'Torch', comments: 'new' },
  ];

  const grouped = aggregateItems(input);
  expect(grouped).toHaveLength(2);

  const torch = grouped.find((group) => group.item.name?.toLowerCase() === 'torch');
  expect(torch).toBeTruthy();
  expect(torch?.quantity).toBe(3);
  expect(torch?.indices).toEqual([0, 1, 4]);
  expect(torch?.item.comments).toBe('new\nwet');

  const rope = grouped.find((group) => group.item.name?.toLowerCase() === 'rope');
  expect(rope).toBeTruthy();
  expect(rope?.quantity).toBe(1);
  expect(rope?.indices).toEqual([3]);
});

test('aggregateItems uses "Unknown" grouping when item name is missing', () => {
  const grouped = aggregateItems([
    { comments: 'mystery 1' },
    undefined,
    { name: '', comments: 'mystery 2' },
  ]);

  expect(grouped).toHaveLength(1);
  expect(grouped[0].quantity).toBe(2);
  expect(grouped[0].indices).toEqual([0, 2]);
});

test('aggregateItems handles pre-existing amount values correctly', () => {
    const input = [
        { name: 'Rations', amount: 5 },
        { name: 'rations', amount: 2 },
    ];

    const grouped = aggregateItems(input);
    expect(grouped).toHaveLength(1);
    expect(grouped[0].quantity).toBe(7);
});

test('aggregateItems treats amount: 0 as quantity: 1', () => {
    const input = [
        { name: 'Crowbar', amount: 0 },
        { name: 'Crowbar', amount: 0 },
    ];

    const grouped = aggregateItems(input);
    expect(grouped).toHaveLength(1);
    expect(grouped[0].quantity).toBe(2);
});
