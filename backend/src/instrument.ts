import 'dotenv/config';
import * as Sentry from '@sentry/node';
import type { ErrorEvent } from '@sentry/node';
import { readFileSync } from 'node:fs';

const packageVersion = (
  JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  ) as { version: string }
).version;

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
const release = process.env.SENTRY_RELEASE?.trim() || `scvmrack@${packageVersion}`;
const environment =
  process.env.SENTRY_ENVIRONMENT?.trim() ||
  process.env.NODE_ENV ||
  'development';

if (process.env.NODE_ENV !== 'test' && dsn) {
  Sentry.init({
    dsn,
    release,
    tracesSampleRate: 1,
    environment,
    initialScope: { tags: { source: 'backend' } },
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
