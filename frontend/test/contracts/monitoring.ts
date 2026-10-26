import * as Sentry from "@sentry/browser";
import { createMonitoringTransport } from "@/utils/monitoringTransport";

const apiOrigin = new URLSearchParams(window.location.search).get("api");
if (!apiOrigin || new URL(apiOrigin).hostname !== "127.0.0.1") {
  throw new Error("A local protocol API is required");
}
Sentry.init({
  dsn: "https://0123456789abcdef@example.invalid/7",
  tunnel: apiOrigin + "/api/tunnel",
  defaultIntegrations: [],
  transport: createMonitoringTransport(apiOrigin),
});
const button = document.createElement("button");
button.textContent = "Report error";
button.onclick = () => {
  Sentry.captureException(new Error("protocol-monitoring-error"));
};
document.body.append(button);
