import assert from 'node:assert/strict';
import test from 'node:test';

import type { ErrorEvent } from '@sentry/node';

import { redactSensitiveRequest } from '../../src/lib/sentry-redact.js';

const event = (request: ErrorEvent['request']): ErrorEvent => ({ type: undefined, request });

test('redactSensitiveRequest drops the session and csrf cookies', () => {
  const result = redactSensitiveRequest(
    event({
      url: 'https://example.test/api/feedback',
      cookies: {
        '__Secure-better-auth.session_token': 'secret-token',
        _csrf: 'csrf-secret',
        _ga: 'GA1.1.1',
      },
    })
  );

  assert.equal(result.request?.cookies, undefined);
  assert.equal(result.request?.url, 'https://example.test/api/feedback');
});

test('redactSensitiveRequest drops sensitive headers case-insensitively and keeps the rest', () => {
  const result = redactSensitiveRequest(
    event({
      headers: {
        Authorization: 'Bearer x',
        Cookie: 'a=b',
        'X-CSRF-Token': 'c',
        'user-agent': 'test',
      },
    })
  );

  assert.deepEqual(result.request?.headers, { 'user-agent': 'test' });
});

test('redactSensitiveRequest tolerates events without a request', () => {
  const bare = { type: undefined } as ErrorEvent;
  assert.equal(redactSensitiveRequest(bare), bare);
});
