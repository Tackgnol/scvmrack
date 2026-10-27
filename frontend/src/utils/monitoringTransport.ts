import { makeFetchTransport } from "@sentry/browser";
import { embeddedSessionHeaders } from "./embed";

/** Keep monitoring independent of the API client, which loads after instrumentation. */
export function createMonitoringTransport(
  backendUrl: string,
): typeof makeFetchTransport {
  let csrfToken: string | null = null;
  let loading: Promise<string> | null = null;
  async function fetchCsrfToken(): Promise<string> {
    const response = await fetch(`${backendUrl}/api/csrf-token`, {
      credentials: "include",
      headers: embeddedSessionHeaders(),
    });
    if (!response.ok) {
      throw new Error("Failed to fetch CSRF token");
    }
    const data = (await response.json()) as { token?: unknown };
    if (typeof data.token !== "string" || !data.token) {
      throw new Error("Invalid CSRF token response");
    }
    csrfToken = data.token;
    return data.token;
  }
  function prepare(): Promise<string> {
    loading ??= fetchCsrfToken().finally(() => {
      loading = null;
    });
    return loading;
  }
  // An unload report must not depend on starting a second network request first.
  // Preparation failure stays quiet; an active report can try again.
  void prepare().catch(() => undefined);
  return (options) =>
    makeFetchTransport(options, async (url, init) => {
      const token = csrfToken ?? (await prepare());
      const send = (csrf: string) => {
        const headers = new Headers(init?.headers);
        headers.set("x-csrf-token", csrf);
        return fetch(url, { ...init, credentials: "include", headers });
      };
      let response = await send(token);
      if (response.status === 403) {
        response = await send(await prepare());
      }
      return response;
    });
}
