import assert from 'node:assert/strict';
import test from 'node:test';
import { classAttribution } from '../../src/lib/class-attribution.ts';

const gm = (ownerName: string | null) => ({ source: 'user' as const, ownerName, creditWork: null, creditAuthor: null });
const zine = { source: 'zine' as const, ownerName: null, creditWork: 'Fermentum', creditAuthor: 'A. Writer' };

test('classAttribution credits a GM, a former GM, and a credited source', () => {
  assert.equal(classAttribution(gm('Ada'), 'en'), 'created by Ada');
  assert.equal(classAttribution(gm(null), 'en'), 'created by a former GM');
  assert.equal(classAttribution(zine, 'en'), 'from Fermentum by A. Writer');
});

test('classAttribution speaks Polish to Polish readers (RPG-319)', () => {
  assert.equal(classAttribution(gm('Ada'), 'pl'), 'stworzona przez Ada');
  assert.equal(classAttribution(gm(null), 'pl'), 'stworzona przez byłego MG');
  assert.equal(classAttribution(zine, 'pl'), 'z Fermentum, autor: A. Writer');
});
