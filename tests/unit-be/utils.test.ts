import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isValidLocale,
  isValidUUID,
  sanitizeCharacterUpdate,
  sanitizeJsonb,
  sanitizeString,
} from '../../src/utils.ts';

test('sanitizeString trims, escapes html, and enforces max length', () => {
  const value = sanitizeString('  <script>alert(1)</script>  ', 20);
  assert.equal(value, '&lt;script&gt;alert(');
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

  assert.equal(sanitized.safe, '&lt;b&gt;x&lt;&#x2F;b&gt;');
  assert.deepEqual(sanitized.nested, { valid: 'yes' });
  assert.deepEqual(sanitized.list, ['<i>1</i>', { ok: 'ok' }]);
});

test('sanitizeCharacterUpdate keeps known fields and clamps numeric bounds', () => {
  const sanitized = sanitizeCharacterUpdate({
    name: '  <b>Hero</b>  ',
    max_hp: 9999,
    current_hp: -999,
    equipment: [{ name: '<axe>' }],
    unknown: 'drop-me',
  });

  assert.deepEqual(sanitized, {
    name: '&lt;b&gt;Hero&lt;&#x2F;b&gt;',
    max_hp: 1000,
    current_hp: -100,
    equipment: [{ name: '&lt;axe&gt;' }],
  });
});

test('identifier and locale validators accept expected values', () => {
  assert.equal(isValidUUID('6f1f0d0b-3f4c-4c13-8e52-a1c99b8c6007'), true);
  assert.equal(isValidUUID('not-a-uuid'), false);
  assert.equal(isValidLocale('en'), true);
  assert.equal(isValidLocale('pl'), true);
  assert.equal(isValidLocale('de'), false);
});
