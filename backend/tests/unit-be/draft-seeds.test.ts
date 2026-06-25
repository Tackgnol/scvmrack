import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  DRAFT_SECTIONS,
  SEED_PATTERN,
  isSectionSeeds,
  randomSectionSeeds,
  randomSeed,
  seededRollerFor,
} from '../../src/lib/draft-seeds.js';

test('randomSeed produces 64-char lowercase hex and differs between calls', () => {
  const a = randomSeed();
  const b = randomSeed();
  assert.match(a, SEED_PATTERN);
  assert.match(b, SEED_PATTERN);
  assert.notEqual(a, b);
});

test('randomSectionSeeds covers every section with valid seeds', () => {
  const seeds = randomSectionSeeds();
  assert.deepEqual(Object.keys(seeds).sort(), [...DRAFT_SECTIONS].sort());
  for (const section of DRAFT_SECTIONS) {
    assert.match(seeds[section], SEED_PATTERN);
  }
});

test('isSectionSeeds accepts valid bundles and rejects bad ones', () => {
  assert.equal(isSectionSeeds(randomSectionSeeds()), true);
  assert.equal(isSectionSeeds(null), false);
  assert.equal(isSectionSeeds([]), false);
  assert.equal(isSectionSeeds({}), false);
  const missing = { ...randomSectionSeeds() } as Record<string, string>;
  delete missing.gear;
  assert.equal(isSectionSeeds(missing), false);
  const badHex = { ...randomSectionSeeds(), stats: 'XYZ' };
  assert.equal(isSectionSeeds(badHex), false);
});

test('seededRollerFor is deterministic per seed and caches per section', async () => {
  const seeds = randomSectionSeeds();
  const rollerFor = seededRollerFor(seeds);

  // Same instance returned for the same section (sequence continuity).
  assert.equal(rollerFor('stats'), rollerFor('stats'));

  // Two factories over identical seeds produce identical roll sequences.
  const again = seededRollerFor({ ...seeds });
  const seq1 = [
    (await rollerFor('gear').roll('1d20')).total,
    (await rollerFor('gear').roll('1d20')).total,
    (await rollerFor('gear').roll('1d20')).total,
  ];
  const seq2 = [
    (await again('gear').roll('1d20')).total,
    (await again('gear').roll('1d20')).total,
    (await again('gear').roll('1d20')).total,
  ];
  assert.deepEqual(seq1, seq2);

  // A different seed gives a different sequence (overwhelmingly likely over 3d20).
  const other = seededRollerFor({ ...seeds, gear: randomSeed() });
  const seq3 = [
    (await other('gear').roll('1d20')).total,
    (await other('gear').roll('1d20')).total,
    (await other('gear').roll('1d20')).total,
  ];
  assert.notDeepEqual(seq1, seq3);
});
