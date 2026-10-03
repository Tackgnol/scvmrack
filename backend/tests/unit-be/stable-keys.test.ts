import assert from 'node:assert/strict';
import test from 'node:test';

import { stableKeys } from '../../src/lib/stable-keys.ts';

const keyFor = (n: number) => `cc.7.ability.${n}`;

test('saved entries keep their key and new ones get the next number', () => {
  assert.deepEqual(
    stableKeys('cc.7.ability.', ['cc.7.ability.1', 'cc.7.ability.2'], ['cc.7.ability.2', undefined], keyFor),
    ['cc.7.ability.2', 'cc.7.ability.3']
  );
});

test('a removed entry whose text is kept never hands its number to a new one', () => {
  // .3 was removed: its row is gone but its translations (and .description) remain.
  const inUse = ['cc.7.ability.1', 'cc.7.ability.3', 'cc.7.ability.3.description'];
  assert.deepEqual(stableKeys('cc.7.ability.', inUse, ['cc.7.ability.1', undefined], keyFor), [
    'cc.7.ability.1',
    'cc.7.ability.4',
  ]);
});

test("another class's key or a repeated key is treated as new", () => {
  assert.deepEqual(
    stableKeys('cc.7.ability.', [], ['cc.8.ability.1', 'cc.7.ability.1', 'cc.7.ability.1'], keyFor),
    ['cc.7.ability.2', 'cc.7.ability.1', 'cc.7.ability.3']
  );
});
