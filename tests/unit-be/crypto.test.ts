import assert from 'node:assert/strict';
import test from 'node:test';

// Must be set before the module is evaluated — crypto.ts throws at load time if missing
process.env.EMAIL_PEPPER = 'test-pepper-at-least-32-chars-long!!';
process.env.EMAIL_ENCRYPTION_KEY = '0'.repeat(64);

// Dynamic import ensures the env vars above are set before module evaluation
const { generateEmailBlindIndex, encryptEmail, decryptEmail } = await import(
  '../../src/services/crypto.ts'
);

// ── generateEmailBlindIndex ───────────────────────────────────────────────────

test('generateEmailBlindIndex returns a 64-char hex string', () => {
  const result = generateEmailBlindIndex('user@example.com');
  assert.match(result, /^[0-9a-f]{64}$/);
});

test('generateEmailBlindIndex is deterministic for the same email', () => {
  const a = generateEmailBlindIndex('user@example.com');
  const b = generateEmailBlindIndex('user@example.com');
  assert.equal(a, b);
});

test('generateEmailBlindIndex normalizes to lowercase', () => {
  const lower = generateEmailBlindIndex('user@example.com');
  const upper = generateEmailBlindIndex('USER@EXAMPLE.COM');
  assert.equal(lower, upper);
});

test('generateEmailBlindIndex trims surrounding whitespace', () => {
  const trimmed = generateEmailBlindIndex('user@example.com');
  const padded = generateEmailBlindIndex('  user@example.com  ');
  assert.equal(trimmed, padded);
});

test('generateEmailBlindIndex produces different values for different emails', () => {
  const a = generateEmailBlindIndex('alice@example.com');
  const b = generateEmailBlindIndex('bob@example.com');
  assert.notEqual(a, b);
});

// ── encryptEmail / decryptEmail ───────────────────────────────────────────────

test('encryptEmail produces iv:authTag:ciphertext format', () => {
  const encrypted = encryptEmail('user@example.com');
  const parts = encrypted.split(':');
  assert.equal(parts.length, 3);
  // IV: 16 bytes = 32 hex chars
  assert.equal(parts[0].length, 32);
  // auth tag: 16 bytes = 32 hex chars
  assert.equal(parts[1].length, 32);
  // ciphertext: at least 1 char
  assert.ok(parts[2].length > 0);
});

test('encryptEmail → decryptEmail round-trips correctly', () => {
  const email = 'user@example.com';
  const encrypted = encryptEmail(email);
  const decrypted = decryptEmail(encrypted);
  assert.equal(decrypted, email);
});

test('encryptEmail normalizes to lowercase before encrypting', () => {
  const encrypted = encryptEmail('USER@EXAMPLE.COM');
  const decrypted = decryptEmail(encrypted);
  assert.equal(decrypted, 'user@example.com');
});

test('encryptEmail trims whitespace before encrypting', () => {
  const encrypted = encryptEmail('  user@example.com  ');
  const decrypted = decryptEmail(encrypted);
  assert.equal(decrypted, 'user@example.com');
});

test('encryptEmail produces different ciphertext each call (random IV)', () => {
  const a = encryptEmail('user@example.com');
  const b = encryptEmail('user@example.com');
  assert.notEqual(a, b);
});

test('decryptEmail throws on wrong number of segments', () => {
  assert.throws(() => decryptEmail('onlyone'), { message: /Invalid encrypted email format/ });
  assert.throws(() => decryptEmail('a:b'), { message: /Invalid encrypted email format/ });
  assert.throws(() => decryptEmail('a:b:c:d'), { message: /Invalid encrypted email format/ });
});

test('decryptEmail throws on invalid IV length', () => {
  // IV segment too short (not 16 bytes / 32 hex chars)
  assert.throws(() => decryptEmail('deadbeef:' + 'a'.repeat(32) + ':' + 'b'.repeat(32)), {
    message: /Invalid IV length/,
  });
});

test('decryptEmail throws on invalid auth tag length', () => {
  // Auth tag segment too short
  assert.throws(() => decryptEmail('a'.repeat(32) + ':deadbeef:' + 'b'.repeat(32)), {
    message: /Invalid GCM auth tag length/,
  });
});

test('decryptEmail throws on tampered ciphertext (GCM auth failure)', () => {
  const encrypted = encryptEmail('user@example.com');
  const parts = encrypted.split(':');
  // Flip a character in the ciphertext
  const tampered = parts[2].slice(0, -1) + (parts[2].endsWith('0') ? '1' : '0');
  assert.throws(() => decryptEmail(`${parts[0]}:${parts[1]}:${tampered}`));
});

test('decryptEmail throws on tampered auth tag (GCM auth failure)', () => {
  const encrypted = encryptEmail('user@example.com');
  const parts = encrypted.split(':');
  // Flip a character in the auth tag
  const tamperedTag = parts[1].slice(0, -1) + (parts[1].endsWith('0') ? '1' : '0');
  assert.throws(() => decryptEmail(`${parts[0]}:${tamperedTag}:${parts[2]}`));
});
