export type ApiErrorDetail = {
  field?: string;
  message: string;
  code?: string;
};

export type ApiErrorPayload = {
  error?: string;
  message?: string;
  code?: string;
  statusCode?: number;
  requestId?: string;
  details?: ApiErrorDetail[];
};

type Translate = (key: string, fallback: string) => string;

type ApiClientErrorOptions = {
  status?: number;
  code?: string;
  requestId?: string;
  details?: ApiErrorDetail[];
  payload?: ApiErrorPayload;
  raw?: unknown;
};

export class ApiClientError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly requestId?: string;
  readonly details?: ApiErrorDetail[];
  readonly payload?: ApiErrorPayload;
  readonly raw?: unknown;

  constructor(message: string, options: ApiClientErrorOptions = {}) {
    super(message);
    this.name = 'ApiClientError';
    this.status = options.status;
    this.code = options.code;
    this.requestId = options.requestId;
    this.details = options.details;
    this.payload = options.payload;
    this.raw = options.raw;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function detailsValue(value: unknown): ApiErrorDetail[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const details: ApiErrorDetail[] = [];

  for (const detail of value) {
    if (!isRecord(detail) || typeof detail.message !== 'string') {
      continue;
    }

    details.push({
      field: stringValue(detail.field),
      message: detail.message,
      code: stringValue(detail.code),
    });
  }

  return details;
}

export function getApiErrorPayload(error: unknown): ApiErrorPayload | undefined {
  if (error instanceof ApiClientError && error.payload) {
    return error.payload;
  }

  if (!isRecord(error)) {
    return undefined;
  }

  const source = isRecord(error.payload) ? error.payload : error;
  const payload: ApiErrorPayload = {
    error: stringValue(source.error),
    message: stringValue(source.message),
    code: stringValue(source.code),
    statusCode: numberValue(source.statusCode),
    requestId: stringValue(source.requestId),
    details: detailsValue(source.details),
  };

  if (
    payload.error ||
    payload.message ||
    payload.code ||
    payload.statusCode ||
    payload.requestId ||
    payload.details?.length
  ) {
    return payload;
  }

  return undefined;
}

export function getApiErrorStatus(error: unknown): number | undefined {
  if (error instanceof ApiClientError) {
    return error.status;
  }

  if (!isRecord(error)) {
    return undefined;
  }

  const direct =
    numberValue(error.status) ??
    numberValue(error.statusCode) ??
    getApiErrorPayload(error)?.statusCode;
  if (direct) return direct;

  const response = error.response;
  if (isRecord(response)) {
    return numberValue(response.status);
  }

  return undefined;
}

export function getApiErrorCode(error: unknown): string | undefined {
  if (error instanceof ApiClientError) {
    return error.code;
  }

  if (!isRecord(error)) {
    return undefined;
  }

  return stringValue(error.code) ?? getApiErrorPayload(error)?.code;
}

export function getApiErrorMessage(error: unknown): string | undefined {
  const payload = getApiErrorPayload(error);
  if (payload?.message) return payload.message;
  if (payload?.error) return payload.error;

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error.length > 0) {
    return error;
  }

  return undefined;
}

export function getApiRequestId(error: unknown): string | undefined {
  if (error instanceof ApiClientError) {
    return error.requestId;
  }

  return getApiErrorPayload(error)?.requestId;
}

export function getApiErrorDetails(error: unknown): ApiErrorDetail[] {
  return getApiErrorPayload(error)?.details ?? [];
}

export function toApiClientError(
  error: unknown,
  response?: Response | null,
  fallbackMessage = 'Request failed'
): ApiClientError {
  if (error instanceof ApiClientError) {
    return error;
  }

  const payload = getApiErrorPayload(error);
  const status = response?.status ?? getApiErrorStatus(error);
  const message =
    payload?.message ??
    payload?.error ??
    getApiErrorMessage(error) ??
    fallbackMessage;

  return new ApiClientError(message, {
    status,
    code: payload?.code ?? getApiErrorCode(error),
    requestId: payload?.requestId ?? getApiRequestId(error),
    details: payload?.details,
    payload,
    raw: error,
  });
}

export function isApiNotFound(error: unknown): boolean {
  return getApiErrorStatus(error) === 404;
}

export function isApiForbidden(error: unknown): boolean {
  return getApiErrorStatus(error) === 403;
}

export function isApiUnauthorized(error: unknown): boolean {
  return getApiErrorStatus(error) === 401;
}

export function isApiPreconditionFailed(error: unknown): boolean {
  return getApiErrorStatus(error) === 412;
}

export function isApiRateLimited(error: unknown): boolean {
  return (
    getApiErrorStatus(error) === 429 ||
    getApiErrorCode(error) === 'RATE_LIMITED' ||
    getApiErrorMessage(error) === 'RATE_LIMIT_EXCEEDED'
  );
}

export function isUnexpectedApiError(error: unknown): boolean {
  const status = getApiErrorStatus(error);
  return typeof status === 'number' && status >= 500;
}

export function getUserFacingApiErrorMessage(
  error: unknown,
  t: Translate,
  fallback = 'Request failed'
): string {
  const status = getApiErrorStatus(error);
  const serverMessage = getApiErrorMessage(error);

  if (status && status >= 500) {
    return t('errors.unexpected', 'Unexpected error occurred.');
  }

  if (status === 400) {
    return serverMessage ?? t('errors.badRequest', 'Check the request and try again.');
  }

  if (status === 401) {
    return t('errors.unauthorized', 'Your session expired. Sign in again.');
  }

  if (status === 403) {
    return (
      serverMessage ??
      t('errors.forbidden', 'You do not have access to this resource.')
    );
  }

  if (status === 404) {
    return serverMessage ?? t('errors.notFound', 'The requested item was not found.');
  }

  if (status === 412) {
    return t(
      'errors.preconditionFailed',
      'This changed somewhere else. Reload and try again.'
    );
  }

  if (status === 429) {
    return t('auth.rateLimit', 'Too many requests. Please try again later.');
  }

  if (!status) {
    return t('errors.network', 'Connection failed. Check your network and try again.');
  }

  return serverMessage ?? t('errors.requestFailed', fallback);
}
