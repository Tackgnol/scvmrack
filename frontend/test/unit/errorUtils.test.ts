import { describe, expect, it } from 'vitest';
import {
  getApiErrorCode,
  getApiErrorDetails,
  getApiErrorStatus,
  getUserFacingApiErrorMessage,
  isApiNotFound,
  isApiRateLimited,
  isUnexpectedApiError,
  toApiClientError,
} from '../../src/utils/errorUtils';

const t = (_key: string, fallback?: string) => fallback ?? _key;

describe('errorUtils', () => {
  it('normalizes structured API error payloads', () => {
    const response = new Response(null, { status: 400 });
    const error = toApiClientError(
      {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'Invalid body',
        requestId: 'req-1',
        details: [{ field: 'name', message: 'must be shorter' }],
      },
      response
    );

    expect(error.message).toBe('Invalid body');
    expect(getApiErrorStatus(error)).toBe(400);
    expect(getApiErrorCode(error)).toBe('VALIDATION_ERROR');
    expect(getApiErrorDetails(error)).toEqual([
      { field: 'name', message: 'must be shorter', code: undefined },
    ]);
  });

  it('distinguishes not-found, rate-limit, and unexpected server errors', () => {
    expect(isApiNotFound({ statusCode: 404 })).toBe(true);
    expect(isApiRateLimited({ statusCode: 429 })).toBe(true);
    expect(isUnexpectedApiError({ statusCode: 500 })).toBe(true);
  });

  it('uses meaningful copy without exposing server crash messages', () => {
    expect(
      getUserFacingApiErrorMessage(
        { statusCode: 500, message: 'password table exploded' },
        t
      )
    ).toBe('Unexpected error occurred.');

    expect(
      getUserFacingApiErrorMessage(
        { statusCode: 404, message: 'Character not found' },
        t
      )
    ).toBe('Character not found');
  });
});
