import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { beforeEach, expect, it, vi } from "vitest";
import { resetRedirectControl } from "@/api";
import { ObrPartyRoster } from "@/components/obr/ObrPartyRoster";
import BrowserTestProvider from "../BrowserTestProvider";

const transport = vi.hoisted(() => {
  const fetch = vi.fn();
  const original = globalThis.fetch;
  const proxy: typeof globalThis.fetch = (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    return url.includes("/api/") ? fetch(input, init) : original(input, init);
  };
  vi.stubGlobal("fetch", proxy);
  return { fetch, proxy };
});

vi.mock("@owlbear-rodeo/sdk", () => ({
  default: {
    onReady: (ready: () => void) => ready(),
    room: { id: "qa-room" },
    player: {
      getId: async () => "gm",
      getRole: async () => "GM",
      getConnectionId: async () => "gm-connection",
      getName: async () => "GM",
    },
    party: { getPlayers: async () => [], onChange: () => () => {} },
    broadcast: { onMessage: () => () => {}, sendMessage: async () => {} },
    scene: {
      isReady: async () => false,
      onReadyChange: () => () => {},
      items: {
        getItems: async () => [],
        onChange: () => () => {},
        updateItems: async () => {
          if (rejectMetadata) {
            throw new Error("Scene cleanup failed");
          }
          tokenMetadataBound = false;
        },
        deleteItems: async () => {},
      },
    },
  },
  buildLabel: vi.fn(),
}));

const characterId = "11111111-1111-4111-8111-111111111111";
let member: boolean;
let playerBound: boolean;
let tokenBound: boolean;
let rejectCleanup: boolean;
let releaseCleanup: (() => void) | undefined;
let holdCleanup: boolean;
let kickedWithBindings: boolean;
let rejectMetadata: boolean;
let tokenMetadataBound: boolean;

beforeEach(() => {
  resetRedirectControl();
  member = true;
  playerBound = true;
  tokenBound = true;
  rejectCleanup = false;
  holdCleanup = false;
  releaseCleanup = undefined;
  kickedWithBindings = false;
  rejectMetadata = false;
  tokenMetadataBound = true;
  vi.stubGlobal("fetch", transport.proxy);
  transport.fetch.mockImplementation(async (input: RequestInfo | URL) => {
    const request = input instanceof Request ? input : new Request(input);
    const path = new URL(request.url).pathname;
    if (path.endsWith("/csrf-token")) {
      return Response.json({ token: "qa-csrf" });
    }
    if (path === "/api/parties/limits") {
      return Response.json({ maxMembers: 10 });
    }
    if (path === "/api/parties") {
      return Response.json([]);
    }
    if (path.endsWith("/class-pool")) {
      return Response.json({
        classes: [],
        classlessEnabled: true,
        removed: [],
      });
    }
    if (path === "/api/parties/promote") {
      return Response.json({
        id: "qa-party",
        name: "QA",
        members: member ? [{ characterId }] : [],
      });
    }
    if (path.endsWith("/bindings")) {
      return Response.json({
        roomId: "qa-room",
        players: playerBound ? [{ playerId: "player", characterId }] : [],
        tokens: tokenBound ? [{ tokenId: "token", characterId }] : [],
      });
    }
    if (path.endsWith("/cards")) {
      return Response.json([]);
    }
    if (request.method === "DELETE") {
      if (holdCleanup && path.includes("/players/")) {
        await new Promise<void>((resolve) => {
          releaseCleanup = resolve;
        });
      }
      if (rejectCleanup && path.includes("/players/")) {
        return Response.json(
          {
            code: "INTERNAL_ERROR",
            message: "Binding cleanup failed",
            statusCode: 503,
          },
          { status: 503 },
        );
      }
      if (path.includes("/players/")) {
        playerBound = false;
      } else {
        tokenBound = false;
      }
      return new Response(null, { status: 204 });
    }
    if (path.endsWith("/kick")) {
      kickedWithBindings = playerBound || tokenBound || tokenMetadataBound;
      member = false;
      return new Response(null, { status: 204 });
    }
    throw new Error("Unexpected QA request: " + request.method + " " + path);
  });
});

async function openRoster() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  await render(
    <BrowserTestProvider>
      <QueryClientProvider client={client}>
        <ObrPartyRoster />
      </QueryClientProvider>
    </BrowserTestProvider>,
  );
  await expect
    .element(
      page.getByRole("button", { name: "Remove from roster", exact: true }),
    )
    .toBeVisible();
}

it("removes bindings before membership, so refreshing cannot bring the removed scvm back", async () => {
  holdCleanup = true;
  await openRoster();
  await userEvent.click(
    page.getByRole("button", { name: "Remove from roster", exact: true }),
  );
  await expect.poll(() => releaseCleanup).toBeTypeOf("function");
  expect(member).toBe(true);
  releaseCleanup!();
  await expect.poll(() => member).toBe(false);
  expect(kickedWithBindings).toBe(false);
  await userEvent.click(
    page.getByRole("button", { name: "Refresh", exact: true }),
  );
  await expect
    .element(
      page.getByRole("button", { name: "Remove from roster", exact: true }),
    )
    .not.toBeInTheDocument();
});

it("keeps membership after failed cleanup and removes the scvm when the GM retries", async () => {
  rejectCleanup = true;
  await openRoster();
  await userEvent.click(
    page.getByRole("button", { name: "Remove from roster", exact: true }),
  );
  await expect
    .element(page.getByText("Binding cleanup failed", { exact: true }))
    .toBeVisible();
  expect(member).toBe(true);
  rejectCleanup = false;
  await userEvent.click(
    page.getByRole("button", { name: "Remove from roster", exact: true }),
  );
  await expect.poll(() => member).toBe(false);
  expect(playerBound || tokenBound).toBe(false);
  await expect
    .element(
      page.getByRole("button", { name: "Remove from roster", exact: true }),
    )
    .not.toBeInTheDocument();
});

it("retries token metadata cleanup before removing its durable binding and membership", async () => {
  rejectMetadata = true;
  await openRoster();
  await userEvent.click(
    page.getByRole("button", { name: "Remove from roster", exact: true }),
  );
  await expect
    .element(page.getByText("Scene cleanup failed", { exact: true }))
    .toBeVisible();
  expect(member).toBe(true);
  expect(tokenBound).toBe(true);
  expect(tokenMetadataBound).toBe(true);
  rejectMetadata = false;
  await userEvent.click(
    page.getByRole("button", { name: "Remove from roster", exact: true }),
  );
  await expect.poll(() => member).toBe(false);
  expect(tokenBound || tokenMetadataBound).toBe(false);
  expect(kickedWithBindings).toBe(false);
});
