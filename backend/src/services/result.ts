import { ApiHttpError, apiError, normalizeKnownApiError } from '../errors.js';

/** Minimal logger shape (Fastify's `request.log` satisfies it). */
export interface ServiceLogger {
  error(obj: unknown, msg?: string): void;
}

/** Stable result type: domain failures are values, never exceptions. */
export type ServiceResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: ApiHttpError };

export const ok = <T>(value: T): ServiceResult<T> => ({ ok: true, value });

export const fail = (error: ApiHttpError): ServiceResult<never> => ({
  ok: false,
  error,
});

/**
 * Log a raw unexpected error and map it to an `ApiHttpError` — a known/Prisma
 * error is normalized to its proper status, otherwise a 5xx with the given
 * code/message. The raw error is logged here so the controller can re-throw the
 * mapped 5xx to the central handler without losing detail.
 */
export function unexpected(
  log: ServiceLogger,
  error: unknown,
  code: string,
  message: string
): ApiHttpError {
  log.error(error);
  return normalizeKnownApiError(error) ?? apiError(500, code, message);
}
