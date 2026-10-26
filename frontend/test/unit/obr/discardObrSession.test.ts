import { QueryClient } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { authKeys, client } from "@/api";
import { discardObrSession } from "@/auth/discardObrSession";
import { fetchSession } from "@/auth";
import {
  confirmTabSession,
  isTabSessionUnverified,
  setTabSession,
  tabSessionSnapshot,
} from "@/utils/tabSession";

afterEach(() => {
  vi.unstubAllGlobals();
  confirmTabSession();
  setTabSession(null);
});

it("clears local identity immediately and blocks cookie-based reads when revocation fails", async () => {
  const queries = new QueryClient();
  queries.setQueryData(authKeys.session(), { user: { id: "unverified" } });
  setTabSession("received-token");
  const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 503 }));
  vi.stubGlobal("fetch", fetch);
  await expect(discardObrSession(queries)).rejects.toThrow(
    "Failed to sign out",
  );
  expect(fetch.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  expect(fetch.mock.calls[0][1].headers.Authorization).toBe(
    "Bearer received-token",
  );
  expect(tabSessionSnapshot()).toBeNull();
  expect(queries.getQueryData(authKeys.session())).toBeNull();
  expect(isTabSessionUnverified()).toBe(true);
  expect(await fetchSession()).toBeNull();
  await expect(client.GET("/api/characters")).rejects.toThrow("Retry sign-out");
  expect(fetch).toHaveBeenCalledOnce();
});

it("bounds sign-out and keeps a stalled revocation quarantined", async () => {
  const queries = new QueryClient();
  setTabSession("received-token");
  vi.stubGlobal(
    "fetch",
    vi.fn(
      (_url: string, options: RequestInit) =>
        new Promise((_resolve, reject) => {
          options.signal?.addEventListener(
            "abort",
            () => reject(options.signal?.reason),
            { once: true },
          );
        }),
    ),
  );
  const failure = expect(discardObrSession(queries)).rejects.toThrow();
  expect(tabSessionSnapshot()).toBeNull();
  expect(isTabSessionUnverified()).toBe(true);
  await failure;
  expect(isTabSessionUnverified()).toBe(true);
}, 4000);
