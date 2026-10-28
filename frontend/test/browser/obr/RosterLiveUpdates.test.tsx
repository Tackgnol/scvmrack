import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { FetchEventSourceInit } from "@microsoft/fetch-event-source";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { beforeEach, expect, it, vi } from "vitest";
import { ObrPartyRoster } from "@/components/obr/ObrPartyRoster";
import { resetRedirectControl } from "@/api";
import { obrKeys } from "@/api/obrKeys";
import BrowserTestProvider from "../BrowserTestProvider";

const stream = vi.hoisted(() => ({
  options: undefined as FetchEventSourceInit | undefined,
}));
vi.mock("@microsoft/fetch-event-source", () => ({
  EventStreamContentType: "text/event-stream",
  fetchEventSource: async (_url: string, options: FetchEventSourceInit) => {
    stream.options = options;
    await openStream(options);
    await new Promise<void>((resolve) =>
      options.signal?.addEventListener("abort", () => resolve(), {
        once: true,
      }),
    );
  },
}));
const transport = vi.hoisted(() => {
  const fetch = vi.fn<typeof globalThis.fetch>();
  const original = globalThis.fetch;
  vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    return url.includes("/api/") ? fetch(input, init) : original(input, init);
  });
  return { fetch };
});
vi.mock("@owlbear-rodeo/sdk", () => ({
  default: {
    onReady: (ready: () => void) => ready(),
    room: { id: "live-room" },
    player: {
      getId: async () => "gm",
      getRole: async () => "GM",
      getName: async () => "GM",
      getMetadata: async () => ({}),
    },
    party: {
      getPlayers: async () => [
        {
          id: "player",
          name: "Player",
          role: "PLAYER",
          connectionId: "online",
          metadata: {},
        },
      ],
      onChange: () => () => {},
    },
    broadcast: { onMessage: () => () => {}, sendMessage: async () => {} },
    scene: {
      isReady: async () => false,
      onReadyChange: () => () => {},
      items: { getItems: async () => [], onChange: () => () => {} },
    },
  },
  buildLabel: vi.fn(),
}));
// Promotion has its own coverage; retain the real roster, app stream and package cache composition.
vi.mock("@/components/obr/ObrRoomPromotion", () => ({
  ObrRoomPromotion: () => null,
}));

let hp: number;
let present: boolean;
let holdFirstCards: boolean;
let releaseCards: (() => void) | undefined;

beforeEach(() => {
  resetRedirectControl();
  stream.options = undefined;
  hp = 1;
  present = true;
  holdFirstCards = false;
  releaseCards = undefined;
  transport.fetch.mockImplementation(async (input, init) => {
    const request = new Request(input, init);
    const path = new URL(request.url).pathname;
    if (path === "/api/parties/limits") {
      return Response.json({ maxMembers: 10 });
    }
    if (path.endsWith("/participation")) {
      return Response.json({
        roomId: "live-room",
        partyId: "live-party",
        canManage: true,
        memberIds: present ? ["scvm"] : [],
        cleanup: [],
        tokens: [],
        players: present
          ? [
              {
                playerId: "player",
                connectionId: "online",
                characterId: "scvm",
              },
            ]
          : [],
      });
    }
    if (path.endsWith("/cards")) {
      const response = Response.json(
        present
          ? [
              {
                id: "scvm",
                name: "Live scvm",
                currentHp: hp,
                maxHp: 4,
                strength: 10,
                agility: 10,
                presence: 10,
                toughness: 10,
                omens: 1,
                maxOmens: 2,
                silver: 5,
                equippedWeapons: [],
                equippedArmor: null,
                computedModifiers: [],
              },
            ]
          : [],
      );
      if (holdFirstCards) {
        holdFirstCards = false;
        await new Promise<void>((resolve) => {
          releaseCards = resolve;
        });
      }
      return response;
    }
    throw new Error(`Unexpected roster request: ${request.method} ${path}`);
  });
});

function send(type: "character.updated" | "character.kicked") {
  expect(stream.options?.onmessage).toBeTypeOf("function");
  stream.options?.onmessage?.({
    event: type,
    id: "",
    data: JSON.stringify({ type, characterId: "scvm", fields: ["currentHp"] }),
  });
}

function openStream(options = stream.options) {
  return options?.onopen?.(
    new Response("", { headers: { "content-type": "text/event-stream" } }),
  );
}

async function renderRoster() {
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: 300000, retry: false } },
  });
  const view = await render(
    <BrowserTestProvider>
      <QueryClientProvider client={client}>
        <ObrPartyRoster />
      </QueryClientProvider>
    </BrowserTestProvider>,
  );
  return { client, view };
}

for (const trigger of ["save", "reconnect"] as const) {
  it(`discards a pre-save HP response still pending on ${trigger}`, async () => {
    holdFirstCards = true;
    await renderRoster();
    await expect.poll(() => releaseCards).toBeTypeOf("function");
    hp = 2;
    if (trigger === "save") {
      send("character.updated");
    } else {
      await openStream();
    }
    releaseCards?.();
    await expect.element(page.getByText("2/4", { exact: true })).toBeVisible();
  });
}

it("shows successive full-sheet save events live and retains the latest HP when reopened (RPG-348)", async () => {
  const { client, view } = await renderRoster();
  await expect.element(page.getByText("1/4", { exact: true })).toBeVisible();
  // Inspect the real package hook's cache, so an SDK key change fails explicitly.
  expect(
    client
      .getQueryCache()
      .findAll({ queryKey: obrKeys.cards() })
      .filter((query) => query.state.data !== undefined)
      .map((query) => query.queryKey),
  ).toEqual([obrKeys.cardSet("live-room", ["scvm"], "en")]);
  await expect.poll(() => stream.options?.onmessage).toBeTypeOf("function");
  for (const value of [2, 3]) {
    hp = value;
    send("character.updated");
    await expect
      .element(page.getByText(`${value}/4`, { exact: true }))
      .toBeVisible();
  }
  await view.rerender(
    <BrowserTestProvider>
      <QueryClientProvider client={client}>{null}</QueryClientProvider>
    </BrowserTestProvider>,
  );
  await view.rerender(
    <BrowserTestProvider>
      <QueryClientProvider client={client}>
        <ObrPartyRoster />
      </QueryClientProvider>
    </BrowserTestProvider>,
  );
  await expect.element(page.getByText("3/4", { exact: true })).toBeVisible();
  // A reopened stream must catch up even if a save happened while disconnected.
  hp = 4;
  await openStream();
  await expect.element(page.getByText("4/4", { exact: true })).toBeVisible();
});

it("keeps a removed scvm absent when a later full-sheet save event arrives", async () => {
  await renderRoster();
  await expect
    .element(page.getByText("Live scvm", { exact: true }))
    .toBeVisible();
  await expect.poll(() => stream.options?.onmessage).toBeTypeOf("function");
  present = false;
  send("character.kicked");
  await expect.element(page.getByText("GM · OVERVIEW 0/10")).toBeVisible();
  hp = 3;
  send("character.updated");
  await expect.element(page.getByText("GM · OVERVIEW 0/10")).toBeVisible();
  await expect
    .element(page.getByText("Live scvm", { exact: true }))
    .not.toBeInTheDocument();
});
