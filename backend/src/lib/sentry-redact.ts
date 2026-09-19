import type { ErrorEvent } from '@sentry/node';

const SENSITIVE_REQUEST_HEADERS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'x-csrf-token',
]);

// The request integration splits the Cookie header into `request.cookies`, so
// redacting the header alone still leaves the live session token and CSRF
// cookie in every stored event.
export const redactSensitiveRequest = (event: ErrorEvent): ErrorEvent => {
  const request = event.request;
  if (!request) return event;

  delete request.cookies;

  const headers = request.headers;
  if (headers) {
    for (const headerName of Object.keys(headers)) {
      if (SENSITIVE_REQUEST_HEADERS.has(headerName.toLowerCase())) {
        delete headers[headerName];
      }
    }
  }

  return event;
};
