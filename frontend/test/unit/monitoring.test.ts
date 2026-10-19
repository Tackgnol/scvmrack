import { describe, expect, it } from "vitest";
import type { ErrorEvent, EventHint } from "@sentry/react";
import { monitoringOperation, prepareFrontendEvent } from "@/monitoring";
import { toApiClientError } from "@/utils/errorUtils";
import { AnonymousSessionUnavailableError } from '@/auth';

const event = (overrides: Partial<ErrorEvent> = {}): ErrorEvent => ({
  type: undefined,
  ...overrides,
});

const hint = (originalException: unknown): EventHint => ({ originalException });

describe("prepareFrontendEvent", () => {
  it.each([400, 401, 403, 404, 429])(
    "drops expected HTTP %i errors",
    (status) => {
      const error = toApiClientError(
        { code: `EXPECTED_${status}`, message: "expected" },
        new Response(null, { status }),
      );

      expect(prepareFrontendEvent(event(), hint(error))).toBeNull();
    },
  );

  it("drops navigation aborts", () => {
    const error = new DOMException("Navigation changed", "AbortError");

    expect(prepareFrontendEvent(event(), hint(error))).toBeNull();
  });

  it("drops errors made entirely of Cloudflare beacon frames", () => {
    const cloudflareEvent = event({
      exception: {
        values: [
          {
            type: "TypeError",
            value: "this.i.at is not a function",
            stacktrace: {
              frames: [
                {
                  filename:
                    "/beacon.min.js/v4513226cdae34746b4dedf0b4dfa099e1781791509496",
                },
              ],
            },
          },
        ],
      },
    });

    expect(
      prepareFrontendEvent(cloudflareEvent, hint(new TypeError("beacon"))),
    ).toBeNull();
  });

  it("keeps app errors even when a Cloudflare frame is also present", () => {
    const appEvent = event({
      exception: {
        values: [
          {
            type: "TypeError",
            value: "App failed",
            stacktrace: {
              frames: [
                { filename: "/assets/app.js" },
                { filename: "/beacon.min.js/v1" },
              ],
            },
          },
        ],
      },
    });

    expect(
      prepareFrontendEvent(appEvent, hint(new TypeError("App failed"))),
    ).toBe(appEvent);
  });

  it("keeps ambiguous crawler session failures", () => {
    const crawlerEvent = event({
      message: "Anonymous session did not start",
      contexts: {
        browser: { name: "Googlebot", version: "2.1" },
        device: { family: "Spider" },
      },
    });

    expect(
      prepareFrontendEvent(crawlerEvent, hint(new Error(crawlerEvent.message))),
    ).toBe(crawlerEvent);
  });

  it("keeps public rendering failures from search indexers", () => {
    const indexerEvent = event({
      contexts: { browser: { name: "meta-webindexer", version: "1.1" } },
    });

    expect(prepareFrontendEvent(indexerEvent, hint(new Error("x")))).toBe(indexerEvent);
  });

  it.each([
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
    'meta-webindexer/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)',
  ])('filters only classified expected session outcomes from raw User-Agent: %s', (userAgent) => {
    const rawEvent = event({ request: { headers: { 'User-Agent': userAgent } } });
    expect(prepareFrontendEvent(rawEvent, hint(new AnonymousSessionUnavailableError()))).toBeNull();
    for (const message of ['Public page crashed', 'Anonymous session did not start', 'Could not verify anonymous session', 'Failed to fetch dynamically imported module']) {
      expect(prepareFrontendEvent(rawEvent, hint(new Error(message)))).toBe(rawEvent);
    }
    expect(prepareFrontendEvent(rawEvent, hint(toApiClientError({}, new Response(null, { status: 503 }))))).toBe(rawEvent);
  });

  it('keeps normal-browser and unknown-client session failures', () => {
    const clients: Record<string, string>[] = [{ 'user-agent': 'Mozilla/5.0 Chrome/140.0' }, {}];
    for (const headers of clients) {
      const rawEvent = event({ request: { headers } });
      expect(prepareFrontendEvent(rawEvent, hint(new AnonymousSessionUnavailableError()))).toBe(rawEvent);
    }
  });

  it.each([
    "InvalidStateError: Transition was aborted because of invalid state",
    "InvalidStateError: Transition was aborted because of invalid state. Viewport size changed",
    "InvalidStateError: Skipped view transition due to graphics process or device reset",
  ])("drops view transition failures: %s", (message) => {
    expect(
      prepareFrontendEvent(event({ message }), hint(new Error(message))),
    ).toBeNull();
  });

  it("fingerprints server API errors by stable code and operation", () => {
    const error = toApiClientError(
      { code: "CHARACTER_READ_FAILED", message: "failed" },
      new Response(null, { status: 503 }),
    );
    const apiEvent = event({ tags: { operation: "load_character" } });

    expect(prepareFrontendEvent(apiEvent, hint(error))).toEqual(
      expect.objectContaining({
        fingerprint: ["api-error", "CHARACTER_READ_FAILED", "load_character"],
        tags: {
          operation: "load_character",
          api_code: "CHARACTER_READ_FAILED",
          http_status: 503,
        },
      }),
    );
  });

  it.each([
    "Failed to fetch",
    "NetworkError when attempting to fetch resource.",
    "Load failed",
  ])("keeps network failures with an unknown cause (%s)", (message) => {
    const networkEvent = event({ tags: { operation: "list_characters" } });

    expect(
      prepareFrontendEvent(networkEvent, hint(new TypeError(message))),
    ).toBe(networkEvent);
  });

  it("keeps stale-chunk import failures", () => {
    const chunkEvent = event({ tags: { operation: "list_characters" } });
    const error = new TypeError(
      "Failed to fetch dynamically imported module: https://scvmrack.rpgtools.co/assets/x.js",
    );

    expect(prepareFrontendEvent(chunkEvent, hint(error))).not.toBeNull();
  });
});

describe("monitoringOperation", () => {
  it("turns query keys into bounded stable operation labels", () => {
    expect(
      monitoringOperation(["get", "/api/characters", { locale: "en" }]),
    ).toBe("get /api/characters");
    expect(monitoringOperation(undefined)).toBe("unknown_operation");
  });
});
