import assert from 'node:assert/strict';
import test from 'node:test';

import { buildClientVerificationUrl } from '../../src/services/url.ts';

test('buildClientVerificationUrl uses request origin when provided', () => {
  const url = buildClientVerificationUrl(
    'http://api:3000/auth/verify?token=abc',
    'https://app.example.com'
  );

  assert.equal(url, 'https://app.example.com/auth/verify?token=abc');
});

test('buildClientVerificationUrl falls back to CLIENT_ORIGIN env', () => {
  const previous = process.env.CLIENT_ORIGIN;
  process.env.CLIENT_ORIGIN = 'https://env.example.com';

  try {
    const url = buildClientVerificationUrl('http://api:3000/auth/magic-link?token=abc');
    assert.equal(url, 'https://env.example.com/auth/magic-link?token=abc');
  } finally {
    process.env.CLIENT_ORIGIN = previous;
  }
});
