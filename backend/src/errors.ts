import { Prisma } from '@prisma/client';
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

export type ApiErrorDetail = {
  field?: string;
  message: string;
  code?: string;
};

export type ApiErrorPayload = {
  error: string;
  message: string;
  code: string;
  statusCode: number;
  requestId: string;
  details?: ApiErrorDetail[];
};

export class ApiHttpError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: ApiErrorDetail[];

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: ApiErrorDetail[]
  ) {
    super(message);
    this.name = 'ApiHttpError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

const STATUS_CODES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  412: 'Precondition Failed',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  503: 'Service Unavailable',
};

const DEFAULT_ERROR_CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'SESSION_REQUIRED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  412: 'PRECONDITION_FAILED',
  429: 'RATE_LIMITED',
  500: 'INTERNAL_ERROR',
  503: 'SERVICE_UNAVAILABLE',
};

export function apiError(
  statusCode: number,
  code: string,
  message: string,
  details?: ApiErrorDetail[]
) {
  return new ApiHttpError(statusCode, code, message, details);
}

export const badRequest = (code: string, message: string, details?: ApiErrorDetail[]) =>
  apiError(400, code, message, details);

export const unauthorized = (message = 'Session required') =>
  apiError(401, 'SESSION_REQUIRED', message);

export const forbidden = (message = 'You do not have access to this resource') =>
  apiError(403, 'FORBIDDEN', message);

export const notFound = (code: string, message: string) =>
  apiError(404, code, message);

export const preconditionFailed = (message: string) =>
  apiError(412, 'PRECONDITION_FAILED', message);

export function toApiErrorPayload(
  error: ApiHttpError,
  requestId: string
): ApiErrorPayload {
  const payload: ApiErrorPayload = {
    error: error.message,
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    requestId,
  };

  if (error.details?.length) {
    payload.details = error.details;
  }

  return payload;
}

export function sendApiError(
  reply: FastifyReply,
  request: FastifyRequest,
  error: ApiHttpError
) {
  return reply.status(error.statusCode).send(toApiErrorPayload(error, request.id));
}

/**
 * Controller convention for rendering a service-layer error: domain failures
 * (4xx) are sent to the client; server failures (5xx) are re-thrown so the
 * central error handler renders them and reports to Sentry.
 */
export function sendServiceError(
  reply: FastifyReply,
  request: FastifyRequest,
  error: ApiHttpError
): FastifyReply {
  if (error.statusCode >= 500) {
    throw error;
  }
  return sendApiError(reply, request, error);
}

function normalizeStatusCode(statusCode: unknown): number {
  if (typeof statusCode !== 'number' || !Number.isInteger(statusCode)) {
    return 500;
  }

  if (statusCode < 400 || statusCode > 599) {
    return 500;
  }

  return statusCode;
}

function validationField(validation: {
  instancePath?: string;
  params?: { missingProperty?: string };
}): string | undefined {
  if (validation.instancePath) {
    return validation.instancePath.replace(/^\//, '').replace(/\//g, '.');
  }

  return validation.params?.missingProperty;
}

function fromValidationError(error: FastifyError): ApiHttpError | null {
  if (!error.validation?.length) {
    return null;
  }

  const details = error.validation.map((validation) => ({
    field: validationField(validation),
    message: validation.message ?? 'Invalid value',
    code: validation.keyword,
  }));

  const context =
    typeof error.validationContext === 'string'
      ? error.validationContext
      : 'request';

  return badRequest('VALIDATION_ERROR', `Invalid ${context}`, details);
}

function postgresCodeFromPrisma(error: Prisma.PrismaClientKnownRequestError) {
  const metaCode = error.meta?.code;
  return typeof metaCode === 'string' ? metaCode : null;
}

function fromPostgresCode(code: string): ApiHttpError | null {
  switch (code) {
    case '22001':
      return badRequest('VALUE_TOO_LONG', 'One of the submitted values is too long');
    case '22P02':
      return badRequest('INVALID_VALUE', 'One of the submitted values is invalid');
    case '23503':
      return badRequest('INVALID_REFERENCE', 'One of the submitted references is invalid');
    case '23505':
      return apiError(409, 'RESOURCE_CONFLICT', 'This record already exists');
    case '23514':
      return badRequest('CONSTRAINT_VIOLATION', 'The submitted values violate a data rule');
    case '40001':
    case '40P01':
      return preconditionFailed('The record changed while saving. Reload and try again');
    default:
      return null;
  }
}

function fromPrismaError(error: unknown): ApiHttpError | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return null;
  }

  if (error.code === 'P2010') {
    const postgresCode = postgresCodeFromPrisma(error);
    return postgresCode ? fromPostgresCode(postgresCode) : null;
  }

  switch (error.code) {
    case 'P2000':
      return badRequest('VALUE_TOO_LONG', 'One of the submitted values is too long');
    case 'P2002':
      return apiError(409, 'RESOURCE_CONFLICT', 'This record already exists');
    case 'P2003':
      return badRequest('INVALID_REFERENCE', 'One of the submitted references is invalid');
    case 'P2006':
    case 'P2023':
      return badRequest('INVALID_VALUE', 'One of the submitted values is invalid');
    case 'P2025':
      return notFound('RECORD_NOT_FOUND', 'Record not found');
    case 'P2024':
      return apiError(503, 'DATABASE_UNAVAILABLE', 'Database is temporarily unavailable');
    case 'P2034':
      return preconditionFailed('The record changed while saving. Reload and try again');
    default:
      return null;
  }
}

function fromKnownError(error: unknown): ApiHttpError | null {
  if (error instanceof ApiHttpError) {
    return error;
  }

  const prismaError = fromPrismaError(error);
  if (prismaError) {
    return prismaError;
  }

  return null;
}

export function normalizeApiError(error: FastifyError | Error): ApiHttpError {
  const known = fromKnownError(error);
  if (known) {
    return known;
  }

  const validation = fromValidationError(error as FastifyError);
  if (validation) {
    return validation;
  }

  const statusCode = normalizeStatusCode((error as FastifyError).statusCode);
  const message =
    statusCode >= 500
      ? 'Unexpected error occurred.'
      : error.message || STATUS_CODES[statusCode] || 'Request failed';
  const code =
    typeof (error as FastifyError).code === 'string'
      ? (error as FastifyError).code
      : DEFAULT_ERROR_CODES[statusCode] ?? 'REQUEST_FAILED';

  return apiError(statusCode, code, message);
}

export function normalizeKnownApiError(error: unknown): ApiHttpError | null {
  return fromKnownError(error);
}
