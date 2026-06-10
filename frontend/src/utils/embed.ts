// Embed (third-party iframe) detection for the itch.io build.
//
// Keep this module dependency-free: it is imported by src/instrument.ts,
// which must stay import-light so Sentry loads before the API client.

export const EMBEDDED_SESSION_HEADER = 'x-embedded-session';

// A cross-origin parent makes window.top access throw — that still means framed.
export function isEmbedded(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

/**
 * Marker header for cookie-issuing requests (`/api/csrf-token`, `/api/auth/*`).
 * When present, shared-auth issues session/CSRF cookies with
 * `SameSite=None; Secure; Partitioned` so they survive the cross-site iframe
 * context; unmarked requests keep the default `SameSite=Lax` cookies.
 */
export function embeddedSessionHeaders(): Record<string, string> {
  return isEmbedded() ? { [EMBEDDED_SESSION_HEADER]: '1' } : {};
}
