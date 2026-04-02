import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildClaimSignature,
  verifyClaimSignature,
} from '../../src/services/claimSignature.ts';

const USER_ID = 'user-abc';
const SOURCE_ID = 'source-xyz';
const CHAR_ID = 'char-123';
const ISSUED_AT = 1_700_000_000_000;

// ── environment setup ─────────────────────────────────────────────────────────

test('buildClaimSignature throws when no secret env var is set', () => {
  const prevSession = process.env.SESSION_SECRET;
  const prevAuth = process.env.BETTER_AUTH_SECRET;
  delete process.env.SESSION_SECRET;
  delete process.env.BETTER_AUTH_SECRET;

  try {
    assert.throws(() => buildClaimSignature(USER_ID, SOURCE_ID, CHAR_ID), {
      message: /SESSION_SECRET or BETTER_AUTH_SECRET must be set/,
    });
  } finally {
    if (prevSession !== undefined) process.env.SESSION_SECRET = prevSession;
    if (prevAuth !== undefined) process.env.BETTER_AUTH_SECRET = prevAuth;
  }
});

// Set a secret for all remaining tests
process.env.BETTER_AUTH_SECRET = 'test-secret-for-unit-tests';

// ── buildClaimSignature ───────────────────────────────────────────────────────

test('buildClaimSignature returns a 64-char hex string', () => {
  const sig = buildClaimSignature(USER_ID, SOURCE_ID, CHAR_ID, ISSUED_AT);
  assert.match(sig!, /^[0-9a-f]{64}$/);
});

test('buildClaimSignature is deterministic for the same inputs', () => {
  const a = buildClaimSignature(USER_ID, SOURCE_ID, CHAR_ID, ISSUED_AT);
  const b = buildClaimSignature(USER_ID, SOURCE_ID, CHAR_ID, ISSUED_AT);
  assert.equal(a, b);
});

test('buildClaimSignature differs when userId changes', () => {
  const a = buildClaimSignature(USER_ID, SOURCE_ID, CHAR_ID, ISSUED_AT);
  const b = buildClaimSignature('other-user', SOURCE_ID, CHAR_ID, ISSUED_AT);
  assert.notEqual(a, b);
});

test('buildClaimSignature differs when sourceUserId changes', () => {
  const a = buildClaimSignature(USER_ID, SOURCE_ID, CHAR_ID, ISSUED_AT);
  const b = buildClaimSignature(USER_ID, 'other-source', CHAR_ID, ISSUED_AT);
  assert.notEqual(a, b);
});

test('buildClaimSignature differs when characterId changes', () => {
  const a = buildClaimSignature(USER_ID, SOURCE_ID, CHAR_ID, ISSUED_AT);
  const b = buildClaimSignature(USER_ID, SOURCE_ID, 'other-char', ISSUED_AT);
  assert.notEqual(a, b);
});

test('buildClaimSignature is not commutative (userId ≠ sourceUserId swap)', () => {
  const a = buildClaimSignature(USER_ID, SOURCE_ID, CHAR_ID, ISSUED_AT);
  const b = buildClaimSignature(SOURCE_ID, USER_ID, CHAR_ID, ISSUED_AT);
  assert.notEqual(a, b);
});

test('buildClaimSignature differs when the issued timestamp changes', () => {
  const a = buildClaimSignature(USER_ID, SOURCE_ID, CHAR_ID, ISSUED_AT);
  const b = buildClaimSignature(USER_ID, SOURCE_ID, CHAR_ID, ISSUED_AT + 1);
  assert.notEqual(a, b);
});

// ── verifyClaimSignature ──────────────────────────────────────────────────────

test('verifyClaimSignature accepts a valid signature', () => {
  const now = Date.now;
  Date.now = () => ISSUED_AT + 1_000;
  try {
    const sig = buildClaimSignature(USER_ID, SOURCE_ID, CHAR_ID, ISSUED_AT)!;
    assert.equal(verifyClaimSignature(USER_ID, SOURCE_ID, CHAR_ID, sig, ISSUED_AT), true);
  } finally {
    Date.now = now;
  }
});

test('verifyClaimSignature rejects an empty signature', () => {
  assert.equal(verifyClaimSignature(USER_ID, SOURCE_ID, CHAR_ID, '', ISSUED_AT), false);
});

test('verifyClaimSignature rejects a signature for wrong userId', () => {
  const sig = buildClaimSignature('wrong-user', SOURCE_ID, CHAR_ID, ISSUED_AT)!;
  assert.equal(verifyClaimSignature(USER_ID, SOURCE_ID, CHAR_ID, sig, ISSUED_AT), false);
});

test('verifyClaimSignature rejects a signature for wrong sourceUserId', () => {
  const sig = buildClaimSignature(USER_ID, 'wrong-source', CHAR_ID, ISSUED_AT)!;
  assert.equal(verifyClaimSignature(USER_ID, SOURCE_ID, CHAR_ID, sig, ISSUED_AT), false);
});

test('verifyClaimSignature rejects a signature for wrong characterId', () => {
  const sig = buildClaimSignature(USER_ID, SOURCE_ID, 'wrong-char', ISSUED_AT)!;
  assert.equal(verifyClaimSignature(USER_ID, SOURCE_ID, CHAR_ID, sig, ISSUED_AT), false);
});

test('verifyClaimSignature rejects a truncated signature (length mismatch guard)', () => {
  const sig = buildClaimSignature(USER_ID, SOURCE_ID, CHAR_ID, ISSUED_AT)!;
  assert.equal(verifyClaimSignature(USER_ID, SOURCE_ID, CHAR_ID, sig.slice(0, 32), ISSUED_AT), false);
});

test('verifyClaimSignature rejects a one-byte-flipped signature', () => {
  const sig = buildClaimSignature(USER_ID, SOURCE_ID, CHAR_ID, ISSUED_AT)!;
  const flipped = sig.slice(0, -1) + (sig.endsWith('0') ? '1' : '0');
  assert.equal(verifyClaimSignature(USER_ID, SOURCE_ID, CHAR_ID, flipped, ISSUED_AT), false);
});

test('verifyClaimSignature rejects a swapped-arg signature (not commutative)', () => {
  const sig = buildClaimSignature(SOURCE_ID, USER_ID, CHAR_ID, ISSUED_AT)!;
  assert.equal(verifyClaimSignature(USER_ID, SOURCE_ID, CHAR_ID, sig, ISSUED_AT), false);
});

test('verifyClaimSignature rejects a missing or invalid timestamp', () => {
  const sig = buildClaimSignature(USER_ID, SOURCE_ID, CHAR_ID, ISSUED_AT)!;
  assert.equal(verifyClaimSignature(USER_ID, SOURCE_ID, CHAR_ID, sig, Number.NaN), false);
  assert.equal(verifyClaimSignature(USER_ID, SOURCE_ID, CHAR_ID, sig, 0), false);
});

test('verifyClaimSignature rejects expired signatures', () => {
  const originalNow = Date.now;
  process.env.CLAIM_SIGNATURE_TTL_MS = '60000';
  Date.now = () => ISSUED_AT + 61_000;

  try {
    const sig = buildClaimSignature(USER_ID, SOURCE_ID, CHAR_ID, ISSUED_AT)!;
    assert.equal(verifyClaimSignature(USER_ID, SOURCE_ID, CHAR_ID, sig, ISSUED_AT), false);
  } finally {
    delete process.env.CLAIM_SIGNATURE_TTL_MS;
    Date.now = originalNow;
  }
});

test('verifyClaimSignature rejects timestamps too far in the future', () => {
  const originalNow = Date.now;
  Date.now = () => ISSUED_AT;

  try {
    const futureIssuedAt = ISSUED_AT + 10 * 60 * 1000;
    const sig = buildClaimSignature(USER_ID, SOURCE_ID, CHAR_ID, futureIssuedAt)!;
    assert.equal(
      verifyClaimSignature(USER_ID, SOURCE_ID, CHAR_ID, sig, futureIssuedAt),
      false
    );
  } finally {
    Date.now = originalNow;
  }
});
