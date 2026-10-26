import * as Sentry from "@sentry/react";
import { createMonitoringTransport } from "@/utils/monitoringTransport";
import { prepareFrontendEvent } from "@/monitoring";

const dsn = import.meta.env.VITE_GLITCHTIP_DSN;
const backendUrl = import.meta.env.VITE_BACKEND_URL || "";
const release = import.meta.env.VITE_SENTRY_RELEASE;
const environment =
  import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE;

if (dsn && !import.meta.env.DEV) {
  Sentry.init({
    dsn,
    tunnel: `${backendUrl}/api/tunnel`,
    release,
    environment,
    initialScope: { tags: { source: "frontend" } },
    beforeSend: prepareFrontendEvent,
    transport: createMonitoringTransport(backendUrl),
    tracesSampleRate: 0.2,
    integrations: (defaultIntegrations) => [
      ...defaultIntegrations.filter(
        (integration) => integration.name !== "BrowserSession",
      ),
      Sentry.browserTracingIntegration(),
      Sentry.captureConsoleIntegration({ levels: ["error"] }),
    ],
  });
}
