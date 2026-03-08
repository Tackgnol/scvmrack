import assert from 'node:assert/strict';
import test from 'node:test';

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
  assert.equal(grouped.length, 2);

  const torch = grouped.find((group) => group.item.name?.toLowerCase() === 'torch');
  assert.ok(torch);
  assert.equal(torch.quantity, 3);
  assert.deepEqual(torch.indices, [0, 1, 4]);
  assert.equal(torch.item.comments, 'new\nwet');

  const rope = grouped.find((group) => group.item.name?.toLowerCase() === 'rope');
  assert.ok(rope);
  assert.equal(rope.quantity, 1);
  assert.deepEqual(rope.indices, [3]);
});

test('aggregateItems uses "Unknown" grouping when item name is missing', () => {
  const grouped = aggregateItems([
    { comments: 'mystery 1' },
    undefined,
    { name: '', comments: 'mystery 2' },
  ]);

  assert.equal(grouped.length, 1);
  assert.equal(grouped[0].quantity, 2);
  assert.deepEqual(grouped[0].indices, [0, 2]);
});
