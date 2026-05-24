import 'dotenv/config';
import * as Sentry from '@sentry/node';
import type { ErrorEvent } from '@sentry/node';

const SENSITIVE_REQUEST_HEADERS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'x-csrf-token',
]);

const redactSensitiveRequestHeaders = (event: ErrorEvent): ErrorEvent => {
  const headers = event.request?.headers;
  if (!headers) return event;

  for (const headerName of Object.keys(headers)) {
    if (SENSITIVE_REQUEST_HEADERS.has(headerName.toLowerCase())) {
      delete headers[headerName];
    }
  }

  return event;
};

const dsn = process.env.GLITCHTIP_DSN;

if (process.env.NODE_ENV !== 'test' && dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 1,
    environment: process.env.NODE_ENV ?? 'development',
    integrations: (defaultIntegrations) => [
      ...defaultIntegrations.filter(
        (integration) => integration.name !== 'ProcessSession'
      ),
      Sentry.fastifyIntegration({
        shouldHandleError: (_error, _request, reply) => reply.statusCode >= 500,
      }),
    ],
    beforeSend: redactSensitiveRequestHeaders,
  });
}
