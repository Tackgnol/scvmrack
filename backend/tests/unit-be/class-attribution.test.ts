import assert from 'node:assert/strict';
import test from 'node:test';
import { classAttribution } from '../../src/lib/class-attribution.ts';

test('classAttribution credits a GM, a former GM, and a credited source', () => {
  assert.equal(classAttribution({ source: 'user', ownerName: 'Ada', creditWork: null, creditAuthor: null }), 'created by Ada');
  assert.equal(classAttribution({ source: 'user', ownerName: null, creditWork: null, creditAuthor: null }), 'created by a former GM');
  assert.equal(classAttribution({ source: 'zine', ownerName: null, creditWork: 'Fermentum', creditAuthor: 'A. Writer' }), 'from Fermentum by A. Writer');
});
