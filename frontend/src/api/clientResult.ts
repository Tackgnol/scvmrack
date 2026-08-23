import { toApiClientError } from "@/utils/errorUtils";

export type ApiResult<T = unknown> = {
  data?: T;
  error?: unknown;
  response?: Response;
};

export type UntypedApiClient = {
  GET: <T>(
    path: string,
    init?: Record<string, unknown>,
  ) => Promise<ApiResult<T>>;
  POST: <T>(
    path: string,
    init?: Record<string, unknown>,
  ) => Promise<ApiResult<T>>;
  PUT: <T>(
    path: string,
    init?: Record<string, unknown>,
  ) => Promise<ApiResult<T>>;
  PATCH: <T>(
    path: string,
    init?: Record<string, unknown>,
  ) => Promise<ApiResult<T>>;
  DELETE: <T>(
    path: string,
    init?: Record<string, unknown>,
  ) => Promise<ApiResult<T>>;
};

export async function unwrapApiResult<T>(
  result: ApiResult<T>,
  fallbackMessage: string,
): Promise<T> {
  const responseOk = result.response?.ok ?? !result.error;
  if (result.error || !responseOk) {
    throw toApiClientError(result.error, result.response, fallbackMessage);
  }

  return result.data as T;
}
