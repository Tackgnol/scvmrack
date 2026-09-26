import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { grantedItemKeyForName, grantedPetKeyForName } from '../../src/lib/class-grants.js';

const SEED_DIR = fileURLToPath(new URL('../../init/05-seed/', import.meta.url));

function readSeeds(): string {
  return readdirSync(SEED_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .map((file) => readFileSync(join(SEED_DIR, file), 'utf8'))
    .join('\n');
}

// JSON inside SQL string literals escapes apostrophes as ''.
function seededGrantNames(sql: string, field: 'gainItem' | 'gainPet'): string[] {
  const pattern = new RegExp(`"${field}": "((?:[^"\\\\]|\\\\.)*)"`, 'g');
  const names = new Set<string>();
  for (const match of sql.matchAll(pattern)) {
    names.add(match[1].replace(/''/g, "'"));
  }
  return [...names].sort();
}

// Catalog rows start their tuple with the key (optionally after a numeric id);
// translation rows start with a locale, so they don't match.
function seededCatalogKeys(sql: string): Set<string> {
  const pattern = /\(\s*(?:\d+,\s*)?'((?:weapons|armors?|equipment|pets)\.[a-z0-9-]+)'/g;
  return new Set([...sql.matchAll(pattern)].map((match) => match[1]));
}

const seeds = readSeeds();
const catalogKeys = seededCatalogKeys(seeds);

test('every seeded class gainItem resolves to a seeded catalog item', () => {
  const names = seededGrantNames(seeds, 'gainItem');
  assert.ok(names.length > 0, 'expected seeded gainItem entries');
  for (const name of names) {
    const key = catalogKeys.has(name) ? name : grantedItemKeyForName(name);
    assert.ok(key, `gainItem "${name}" has no catalog key`);
    assert.ok(catalogKeys.has(key), `gainItem "${name}" maps to missing catalog row ${key}`);
  }
});

test('every seeded class gainPet resolves to a seeded pet', () => {
  const names = seededGrantNames(seeds, 'gainPet');
  assert.ok(names.length > 0, 'expected seeded gainPet entries');
  for (const name of names) {
    const key = catalogKeys.has(name) ? name : grantedPetKeyForName(name);
    assert.ok(key, `gainPet "${name}" has no pet key`);
    assert.ok(catalogKeys.has(key), `gainPet "${name}" maps to missing pet row ${key}`);
  }
});

test('granted names resolve regardless of apostrophe style', () => {
  assert.equal(grantedItemKeyForName('Sacred Shepherd’s Crook'), 'weapons.sacred-shepherds-crook');
  assert.equal(grantedItemKeyForName("Sacred Shepherd's Crook"), 'weapons.sacred-shepherds-crook');
  assert.equal(grantedPetKeyForName('Poltroon the Court Jester'), 'pets.poltroon');
});
