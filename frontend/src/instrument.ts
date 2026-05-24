import * as Sentry from '@sentry/react';
import { makeFetchTransport } from '@sentry/browser';

const dsn = import.meta.env.VITE_GLITCHTIP_DSN;
const backendUrl = import.meta.env.VITE_BACKEND_URL || '';

// CSRF token fetch is intentionally duplicated from src/api/index.ts so this
// module stays import-light — Sentry instrumentation needs to load before the
// generated API client and TanStack Query, and pulling them in here would
// reorder app startup. Keep the two implementations in sync if either changes.
let csrfToken: string | null = null;

async function fetchCsrfToken(): Promise<string> {
  const res = await fetch(`${backendUrl}/api/csrf-token`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch CSRF token');
  const data = (await res.json()) as { token: string };
  csrfToken = data.token;
  return data.token;
}

if (dsn && !import.meta.env.DEV) {
  Sentry.init({
    dsn,
    tunnel: `${backendUrl}/api/tunnel`,
    initialScope: { tags: { source: 'frontend' } },
    transport: (options) =>
      makeFetchTransport(options, async (url, init) => {
        const token = csrfToken ?? (await fetchCsrfToken());
        const send = (csrf: string): Promise<Response> =>
          fetch(url, {
            ...init,
            credentials: 'include',
            headers: { ...init?.headers, 'x-csrf-token': csrf },
          });
        let response = await send(token);
        if (response.status === 403) {
          const fresh = await fetchCsrfToken();
          response = await send(fresh);
        }
        return response;
      }),
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.2,
    integrations: (defaultIntegrations) => [
      ...defaultIntegrations.filter(
        (integration) => integration.name !== 'BrowserSession'
      ),
      Sentry.browserTracingIntegration(),
      Sentry.captureConsoleIntegration({ levels: ['error'] }),
    ],
  });
}
