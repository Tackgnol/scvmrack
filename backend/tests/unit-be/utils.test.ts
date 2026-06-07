import assert from 'node:assert/strict';
import test from 'node:test';

import {
  camelCaseJsonbFields,
  isValidLocale,
  isValidUUID,
  sanitizeCharacterUpdate,
  sanitizeJsonb,
  sanitizeString,
} from '../../src/utils.ts';

test('sanitizeString trims plain text without html-encoding user content', () => {
  const value = sanitizeString("  It's quite <obnoxious> really  ", 20);
  assert.equal(value, "It's quite <obnoxiou");
});

test('sanitizeJsonb recursively sanitizes and drops dangerous keys', () => {
  const sanitized = sanitizeJsonb({
    safe: '<b>x</b>',
    nested: {
      '__proto__': 'pollute',
      valid: ' yes ',
    },
    list: ['<i>1</i>', { constructor: 'skip', ok: 'ok' }],
  }) as Record<string, unknown>;

  assert.equal(sanitized.safe, '<b>x</b>');
  assert.deepEqual(sanitized.nested, { valid: 'yes' });
  assert.deepEqual(sanitized.list, ['<i>1</i>', { ok: 'ok' }]);
});

test('sanitizeCharacterUpdate keeps known fields and clamps numeric bounds', () => {
  const sanitized = sanitizeCharacterUpdate({
    name: '  <b>Hero</b>  ',
    maxHp: 9999,
    currentHp: -999,
    equipment: [{ name: '<axe>' }],
    unknown: 'drop-me',
  });

  assert.deepEqual(sanitized, {
    name: '<b>Hero</b>',
    maxHp: 1000,
    currentHp: -100,
    equipment: [{ name: '<axe>' }],
  });
});

test('camelCaseJsonbFields normalizes top-level and nested snake_case keys', () => {
  const createdAt = new Date('2026-03-26T10:11:12.000Z');
  const normalized = camelCaseJsonbFields({
    current_hp: 7,
    max_hp: 10,
    created_at: createdAt,
    equipped_armor: {
      current_tier: 1,
      max_tier: 2,
    },
    computed_modifiers: [
      {
        origin_key: 'armor.tattered',
        origin_name: 'Tattered Armor',
      },
    ],
  }) as Record<string, unknown>;

  assert.deepEqual(normalized, {
    currentHp: 7,
    maxHp: 10,
    createdAt,
    equippedArmor: {
      currentTier: 1,
      maxTier: 2,
    },
    computedModifiers: [
      {
        originKey: 'armor.tattered',
        originName: 'Tattered Armor',
      },
    ],
  });
});

test('identifier and locale validators accept expected values', () => {
  assert.equal(isValidUUID('6f1f0d0b-3f4c-4c13-8e52-a1c99b8c6007'), true);
  assert.equal(isValidUUID('not-a-uuid'), false);
  assert.equal(isValidLocale('en'), true);
  assert.equal(isValidLocale('pl'), true);
  assert.equal(isValidLocale('de'), false);
});
