import assert from 'node:assert/strict';
import test from 'node:test';
import type { FastifyError } from 'fastify';
import {
  apiError,
  normalizeApiError,
  toApiErrorPayload,
} from '../../src/errors.ts';

test('toApiErrorPayload preserves compatibility and structured fields', () => {
  const payload = toApiErrorPayload(
    apiError(403, 'FORBIDDEN', 'You do not have access'),
    'req-1'
  );

  assert.deepEqual(payload, {
    error: 'You do not have access',
    message: 'You do not have access',
    code: 'FORBIDDEN',
    statusCode: 403,
    requestId: 'req-1',
  });
});

test('normalizeApiError converts Fastify validation errors to 400 details', () => {
  const error = new Error('body must match schema') as FastifyError;
  error.validationContext = 'body';
  error.validation = [
    {
      instancePath: '/name',
      schemaPath: '#/properties/name/type',
      keyword: 'type',
      params: {},
      message: 'must be string',
    },
  ];

  const normalized = normalizeApiError(error);

  assert.equal(normalized.statusCode, 400);
  assert.equal(normalized.code, 'VALIDATION_ERROR');
  assert.deepEqual(normalized.details, [
    { field: 'name', message: 'must be string', code: 'type' },
  ]);
});

test('normalizeApiError hides unexpected error messages', () => {
  const error = new Error('database password leaked');
  const normalized = normalizeApiError(error);

  assert.equal(normalized.statusCode, 500);
  assert.equal(normalized.code, 'INTERNAL_ERROR');
  assert.equal(normalized.message, 'Unexpected error occurred.');
});
