import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { abilityGrantedItems } from '../../src/lib/class-grants.js';

const SEED_DIR = fileURLToPath(new URL('../../init/05-seed/', import.meta.url));
const MIGRATION = fileURLToPath(
  new URL('../../prisma/migrations/20261001130000_ability_grants/migration.sql', import.meta.url)
);

// What the Book Classes granted through the retired name maps and positional
// `random_abilities` JSON, captured from a seeded database before the switch.
const GOLDEN_GRANTS = [
  ['abilities.esoteric_hermit.hawk', null, 'pets.hawk'],
  ['abilities.fanged_deserter.hound', null, 'pets.gore-hound'],
  ['abilities.fanged_deserter.mask', 'equipment.crumpled-monster-mask', null],
  ['abilities.fanged_deserter.scimitar', 'weapons.brown-scimitar', null],
  ['abilities.fanged_deserter.shoe', 'weapons.shoe-of-death', null],
  ['abilities.fanged_deserter.sling', 'weapons.sigurd-sling', null],
  ['abilities.fanged_deserter.teeth', 'equipment.wizard-teeth', null],
  ['abilities.gutterborn_scum.fingersmith', 'equipment.lockpicks', null],
  ['abilities.heretical_priest.crook', 'weapons.sacred-shepherds-crook', null],
  ['abilities.wretched_royalty.barbarister', null, 'pets.barbarister'],
  ['abilities.wretched_royalty.blade', 'weapons.blade-of-ancestors', null],
  ['abilities.wretched_royalty.gift', 'weapons.snake-skin-gift', null],
  ['abilities.wretched_royalty.hamfund', null, 'pets.hamfund'],
];

function readSeeds(): string {
  return readdirSync(SEED_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .map((file) => readFileSync(join(SEED_DIR, file), 'utf8'))
    .join('\n');
}

function grantRows(sql: string): Array<[string, string | null, string | null]> {
  const literal = (value: string) => (value === 'NULL' ? null : value.slice(1, -1));
  const pattern = /\('(abilities\.[a-z_]+\.[a-z_]+)', (NULL|'[^']+'), (NULL|'[^']+')\)/g;
  return [...sql.matchAll(pattern)]
    .map((m): [string, string | null, string | null] => [m[1], literal(m[2]), literal(m[3])])
    .sort((a, b) => a[0].localeCompare(b[0]));
}

// Catalog rows start their tuple with the key (optionally after a numeric id);
// translation rows start with a locale, so they don't match.
function seededCatalogKeys(sql: string): Set<string> {
  const pattern = /\(\s*(?:\d+,\s*)?'((?:weapons|armors?|equipment|pets)\.[a-z0-9-]+)'/g;
  return new Set([...sql.matchAll(pattern)].map((match) => match[1]));
}

const seeds = readSeeds();

test('seeded Book Class grants match what the old name maps granted', () => {
  assert.deepEqual(grantRows(seeds), GOLDEN_GRANTS);
});

test('the migration grants the same as the seed', () => {
  assert.deepEqual(grantRows(readFileSync(MIGRATION, 'utf8')), GOLDEN_GRANTS);
});

test('every seeded grant points at a seeded catalog row', () => {
  const catalogKeys = seededCatalogKeys(seeds);
  for (const [ability, item, pet] of GOLDEN_GRANTS) {
    if (item) {
      assert.ok(catalogKeys.has(item), `${ability} grants missing item ${item}`);
    }
    if (pet) {
      assert.ok(catalogKeys.has(pet), `${ability} grants missing pet ${pet}`);
    }
  }
});

const tagsFor = (key: string) => [`tag:${key}`];

test('an ability grants its item, then its pet, with catalog tags', () => {
  assert.deepEqual(
    abilityGrantedItems({ grantItemKey: 'weapons.brown-scimitar', grantPetKey: 'pets.hawk' }, tagsFor),
    [
      { key: 'weapons.brown-scimitar', tags: ['tag:weapons.brown-scimitar'] },
      { key: 'pets.hawk', tags: ['tag:pets.hawk'] },
    ]
  );
});

test('an ability without grants grants nothing', () => {
  assert.deepEqual(abilityGrantedItems({ grantItemKey: null, grantPetKey: null }, tagsFor), []);
});

test('granted Wizard Teeth carry four use pips', () => {
  assert.deepEqual(
    abilityGrantedItems({ grantItemKey: 'equipment.wizard-teeth', grantPetKey: null }, tagsFor),
    [
      {
        key: 'equipment.wizard-teeth',
        tags: ['tag:equipment.wizard-teeth'],
        uses: [false, false, false, false],
      },
    ]
  );
});
