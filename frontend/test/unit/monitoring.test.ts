import { describe, expect, it } from "vitest";
import type { ErrorEvent, EventHint } from "@sentry/react";
import { monitoringOperation, prepareFrontendEvent } from "@/monitoring";
import { toApiClientError } from "@/utils/errorUtils";

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

  it("drops known crawler chunk-load failures", () => {
    const crawlerEvent = event({
      message:
        "Failed to fetch dynamically imported module: https://example.test/assets/page.js",
      contexts: {
        browser: { name: "Googlebot", version: "2.1" },
        device: { family: "Spider" },
      },
    });

    expect(
      prepareFrontendEvent(
        crawlerEvent,
        hint(new TypeError(crawlerEvent.message)),
      ),
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

  it("keeps and fingerprints genuine network failures", () => {
    const networkEvent = event({ tags: { operation: "list_characters" } });

    expect(
      prepareFrontendEvent(
        networkEvent,
        hint(new TypeError("Failed to fetch")),
      ),
    ).toEqual(
      expect.objectContaining({
        fingerprint: ["api-error", "NETWORK_FAILURE", "list_characters"],
      }),
    );
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
