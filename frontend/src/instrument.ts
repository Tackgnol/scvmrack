import * as Sentry from '@sentry/react';

const dsn = import.meta.env.VITE_GLITCHTIP_DSN;

if (dsn && !import.meta.env.DEV) {
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.01,
    integrations: (defaultIntegrations) => [
      ...defaultIntegrations.filter(
        (integration) => integration.name !== 'BrowserSession'
      ),
      Sentry.browserTracingIntegration(),
    ],
  });
}
