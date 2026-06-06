import { expect, test } from 'vitest';

import { aggregateItems } from '../../src/utils/aggregateItems.ts';

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

test('aggregateItems does NOT merge same-named items that differ in identity fields', () => {
  const grouped = aggregateItems([
    { name: 'Dagger', dice: [4], comments: null },
    { name: 'Dagger', dice: [6], comments: null },
  ]);

  // A d4 Dagger and a d6 Dagger are different items and must stay separate.
  expect(grouped).toHaveLength(2);
  expect(grouped.every((group) => group.quantity === 1)).toBe(true);
});

test('aggregateItems stacks items that share a stable key', () => {
  const grouped = aggregateItems([
    { key: 'weapons.sword', name: 'Sword', comments: null },
    { key: 'weapons.sword', name: 'Sword', comments: null },
  ]);

  expect(grouped).toHaveLength(1);
  expect(grouped[0].quantity).toBe(2);
  expect(grouped[0].indices).toEqual([0, 1]);
});

test('aggregateItems keeps unique-keyed custom items as individual lines', () => {
  const grouped = aggregateItems([
    { key: 'custom.weapon.aaa', name: 'Sword of Strength', comments: null },
    { key: 'custom.weapon.bbb', name: 'Sword of Strength', comments: null },
  ]);

  expect(grouped).toHaveLength(2);
});

test('aggregateItems uses "Unknown" grouping when item name is missing', () => {
  const grouped = aggregateItems([
    { comments: 'mystery 1' },
    undefined,
    { name: '', comments: 'mystery 3' },
  ]);

  expect(grouped).toHaveLength(1);
  expect(grouped[0].quantity).toBe(2);
  expect(grouped[0].indices).toEqual([0, 2]);
});
