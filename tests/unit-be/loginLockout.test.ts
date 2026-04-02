import assert from 'node:assert/strict';
import test, { afterEach, beforeEach, mock } from 'node:test';

import {
  clearLoginFailures,
  getLockedUntil,
  loginAttempts,
  recordLoginFailure,
} from '../../src/services/loginLockout.ts';

// Use unique keys per test group to avoid cross-test interference
let keyCounter = 0;
function uniqueKey(): string {
  return `test-hash-${++keyCounter}`;
}

beforeEach(() => {
  loginAttempts.clear();
});

afterEach(() => {
  loginAttempts.clear();
  mock.restoreAll();
});

function withMockedNow<T>(now: number, run: () => T): T {
  mock.method(Date, 'now', () => now);
  return run();
}

// ── getLockedUntil ────────────────────────────────────────────────────────────

test('getLockedUntil returns null for an unknown email hash', () => {
  assert.equal(getLockedUntil('no-such-key'), null);
});

test('getLockedUntil returns null before any lockout is triggered', () => {
  const key = uniqueKey();
  recordLoginFailure(key); // 1 failure — below threshold
  assert.equal(getLockedUntil(key), null);
});

test('getLockedUntil returns a future timestamp once locked', () => {
  const key = uniqueKey();
  const before = Date.now();
  for (let i = 0; i < 5; i++) recordLoginFailure(key);
  const lockedUntil = getLockedUntil(key);
  assert.ok(lockedUntil !== null);
  assert.ok(lockedUntil > before);
});

test('getLockedUntil returns null after lockout has expired', () => {
  const key = uniqueKey();
  // Manually inject an expired record
  loginAttempts.set(key, { count: 5, lockedUntil: Date.now() - 1 });
  assert.equal(getLockedUntil(key), null);
});

// ── recordLoginFailure ────────────────────────────────────────────────────────

test('no lockout before reaching MAX_FAILURES (5) attempts', () => {
  const key = uniqueKey();
  for (let i = 0; i < 4; i++) recordLoginFailure(key);
  assert.equal(getLockedUntil(key), null);
});

test('lockout is applied at exactly MAX_FAILURES (5th failure)', () => {
  const key = uniqueKey();
  for (let i = 0; i < 5; i++) recordLoginFailure(key);
  assert.ok(getLockedUntil(key) !== null);
});

test('first lockout duration is ~60 seconds (tier 0)', () => {
  const key = uniqueKey();
  const now = 1_700_000_000_000;

  withMockedNow(now, () => {
    for (let i = 0; i < 5; i++) recordLoginFailure(key);
  });

  const lockedUntil = getLockedUntil(key)!;
  assert.equal(lockedUntil - now, 60_000);
});

test('second lockout tier (failures 6–10) is ~300 seconds', () => {
  const key = uniqueKey();
  const now = 1_700_000_000_000;

  withMockedNow(now, () => {
    for (let i = 0; i < 10; i++) recordLoginFailure(key);
  });

  const lockedUntil = getLockedUntil(key)!;
  assert.equal(lockedUntil - now, 300_000);
});

test('third lockout tier (failures 11–15) is ~900 seconds', () => {
  const key = uniqueKey();
  const now = 1_700_000_000_000;

  withMockedNow(now, () => {
    for (let i = 0; i < 15; i++) recordLoginFailure(key);
  });

  const lockedUntil = getLockedUntil(key)!;
  assert.equal(lockedUntil - now, 900_000);
});

test('lockout tier is capped at maximum (3600 seconds)', () => {
  const key = uniqueKey();
  const now = 1_700_000_000_000;

  withMockedNow(now, () => {
    for (let i = 0; i < 25; i++) recordLoginFailure(key);
  });

  const lockedUntil = getLockedUntil(key)!;
  assert.equal(lockedUntil - now, 3_600_000);
});

// ── clearLoginFailures ────────────────────────────────────────────────────────

test('clearLoginFailures removes an active lockout', () => {
  const key = uniqueKey();
  for (let i = 0; i < 5; i++) recordLoginFailure(key);
  assert.ok(getLockedUntil(key) !== null, 'should be locked before clearing');
  clearLoginFailures(key);
  assert.equal(getLockedUntil(key), null);
});

test('clearLoginFailures removes the record entirely', () => {
  const key = uniqueKey();
  for (let i = 0; i < 3; i++) recordLoginFailure(key);
  clearLoginFailures(key);
  assert.equal(loginAttempts.has(key), false);
});

test('clearLoginFailures on unknown key is a no-op', () => {
  assert.doesNotThrow(() => clearLoginFailures('no-such-hash'));
});

test('after clearLoginFailures, failure count resets to zero', () => {
  const key = uniqueKey();
  // Trigger lockout, then clear
  for (let i = 0; i < 5; i++) recordLoginFailure(key);
  clearLoginFailures(key);
  // Now 4 more failures should still be below threshold
  for (let i = 0; i < 4; i++) recordLoginFailure(key);
  assert.equal(getLockedUntil(key), null);
});
