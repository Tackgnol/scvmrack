import type { ErrorEvent, EventHint } from "@sentry/react";
import {
  getApiErrorCode,
  getApiErrorStatus,
  shouldCaptureClientError,
} from "@/utils/errorUtils";

const CLOUDFLARE_BEACON_RE = /\/beacon\.min\.js(?:\/|$)/i;
const CHUNK_LOAD_FAILURE_RE =
  /(?:failed to fetch dynamically imported module|importing a module script failed)/i;
const CRAWLER_RE = /(?:bot|crawler|spider)/i;

function eventMessages(event: ErrorEvent): string[] {
  const messages = [event.message];

  for (const exception of event.exception?.values ?? []) {
    messages.push(exception.value);
  }

  return messages.filter((message): message is string => !!message);
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

function isKnownCrawlerChunkFailure(event: ErrorEvent): boolean {
  const browserName = event.contexts?.browser?.name ?? "";
  const deviceFamily = event.contexts?.device?.family ?? "";
  const isCrawler = CRAWLER_RE.test(`${browserName} ${deviceFamily}`);

  return (
    isCrawler &&
    eventMessages(event).some((message) => CHUNK_LOAD_FAILURE_RE.test(message))
  );
}

function stringTag(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function isNetworkFailure(error: unknown): boolean {
  return (
    error instanceof Error &&
    /(?:failed to fetch|load failed|networkerror|network request failed)/i.test(
      error.message,
    )
  );
}

export function monitoringOperation(
  key: readonly unknown[] | undefined,
): string {
  if (!key) return "unknown_operation";

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
    isKnownCrawlerChunkFailure(event)
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
    code ??
    (status !== undefined ? `HTTP_${status}` : undefined) ??
    (isNetworkFailure(originalError) ? "NETWORK_FAILURE" : undefined);

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
