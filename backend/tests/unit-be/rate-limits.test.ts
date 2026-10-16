import test from 'node:test';
import assert from 'node:assert/strict';
import { rateLimitScale } from '../../src/lib/rate-limits.js';

test('rate limit scale defaults to 1 and reads a positive multiplier', () => {
  assert.equal(rateLimitScale(undefined), 1);
  assert.equal(rateLimitScale(''), 1);
  assert.equal(rateLimitScale('1000'), 1000);
});

test('rate limit scale refuses values that would weaken or break limits silently', () => {
  for (const raw of ['0', '0.5', '-3', 'lots', 'NaN']) {
    assert.throws(() => rateLimitScale(raw), /RATE_LIMIT_SCALE/);
  }
});
