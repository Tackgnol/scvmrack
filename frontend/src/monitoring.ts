import type { ErrorEvent, EventHint } from "@sentry/react";
import {
  getApiErrorCode,
  getApiErrorStatus,
  shouldCaptureClientError,
} from "@/utils/errorUtils";

const CLOUDFLARE_BEACON_RE = /\/beacon\.min\.js(?:\/|$)/i;
const CRAWLER_RE = /\b(?:Googlebot|bingbot|meta-webindexer)\b/i;

// Browser-side View Transitions API failures (viewport resize, GPU reset,
// superseded transition). Cosmetic: the navigation itself still completes.
const VIEW_TRANSITION_RE =
  /(?:transition was aborted because of invalid state|skipped view transition)/i;

function isViewTransitionError(event: ErrorEvent, error: unknown): boolean {
  const messages = [
    error instanceof Error ? error.message : undefined,
    event.message,
    ...(event.exception?.values ?? []).map((exception) => exception.value),
  ];

  return messages.some((message) => VIEW_TRANSITION_RE.test(message ?? ""));
}

function hasCloudflareBeaconFrame(event: ErrorEvent): boolean {
  const frames = (event.exception?.values ?? []).flatMap(
    (exception) => exception.stacktrace?.frames ?? [],
  );

  return (
    frames.length > 0 &&
    frames.every((frame) => CLOUDFLARE_BEACON_RE.test(frame.filename ?? ""))
  );
}

function isCrawlerEvent(event: ErrorEvent): boolean {
  const userAgent = Object.entries(event.request?.headers ?? {}).find(
    ([name]) => name.toLowerCase() === 'user-agent',
  )?.[1] ?? '';
  const browserName = event.contexts?.browser?.name ?? "";

  return CRAWLER_RE.test(`${userAgent} ${browserName}`);
}

function stringTag(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function monitoringOperation(
  key: readonly unknown[] | undefined,
): string {
  if (!key) {
    return "unknown_operation";
  }

  const parts = key.filter(
    (part): part is string => typeof part === "string" && part.length > 0,
  );
  return parts.slice(0, 2).join(" ") || "unknown_operation";
}

export function prepareFrontendEvent(
  event: ErrorEvent,
  hint: EventHint,
): ErrorEvent | null {
  const originalError = hint.originalException;

  if (
    (originalError !== undefined && !shouldCaptureClientError(originalError)) ||
    hasCloudflareBeaconFrame(event) ||
    (isCrawlerEvent(event) &&
      (getApiErrorCode(originalError) === 'ANONYMOUS_SESSION_UNAVAILABLE' ||
        (event.tags?.source === 'auth' && event.tags?.anonymous_bootstrap === 'tab-session'))) ||
    isViewTransitionError(event, originalError)
  ) {
    return null;
  }

  const operation = stringTag(event.tags?.operation);
  if (!operation || originalError === undefined) {
    return event;
  }

  const status = getApiErrorStatus(originalError);
  const code = getApiErrorCode(originalError);
  const groupingCode =
    code ?? (status !== undefined ? `HTTP_${status}` : undefined);

  if (!groupingCode) {
    return event;
  }

  event.fingerprint = ["api-error", groupingCode, operation];
  event.tags = {
    ...event.tags,
    api_code: groupingCode,
    ...(status !== undefined && { http_status: status }),
  };

  return event;
}
