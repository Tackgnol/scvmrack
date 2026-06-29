import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BrowserTestProvider from "./BrowserTestProvider";
import { ObrCharacterRoute } from "@/components/obr/ObrCharacterRoute";
import { CHARACTER_META_KEY } from "@/obr/extension";
import i18n from "@/i18n";

type Role = "GM" | "PLAYER";
type TestCharacter = {
  id?: string;
  name?: string;
  updatedAt?: string;
};

const routeMocks = vi.hoisted(() => ({
  role: null as Role | null,
  generateNew: vi.fn(),
  promoteRoom: vi.fn(),
  setCharacterId: vi.fn(),
  signIn: vi.fn(),
  useCharacter: vi.fn(),
  useObrSession: vi.fn(),
  usePromoteObrRoom: vi.fn(),
  usePartyLimits: vi.fn(),
}));

// The roster/peek data layer is the hand-written @/api/obr fetcher driven by a
// real react-query client (QueryClientProvider below). fetchObrCards resolves
// the staged cards; the (roomId, id) gate is exercised on the backend, so here
// it's a pass-through that simply records its arguments.
const obrApiMock = vi.hoisted(() => {
  const state = {
    cards: undefined as unknown[] | undefined,
  };

  return {
    state,
    fetchObrCards: vi.fn((_ids: string[], _roomId: string, _locale: string) =>
      Promise.resolve(state.cards ?? []),
    ),
    bindObrRoom: vi.fn<() => Promise<void>>(() => Promise.resolve()),
  };
});

const obrMock = vi.hoisted(() => {
  const state = {
    broadcastCallbacks: {} as Record<
      string,
      (event: { data: unknown; connectionId: string }) => void
    >,
    roomMetadata: {} as Record<string, unknown>,
    playerCallback: null as null | ((player: { selection?: string[] }) => void),
    selection: [] as string[] | undefined,
    items: [] as Array<{ id: string; metadata: Record<string, unknown> }>,
    addedItems: [] as unknown[],
  };

  const createLabelBuilder = () => {
    const builder: Record<string, unknown> = {};
    const chain = () => builder;
    for (const method of [
      "name",
      "plainText",
      "width",
      "height",
      "padding",
      "fontFamily",
      "fontSize",
      "fontWeight",
      "textAlign",
      "textAlignVertical",
      "fillColor",
      "fillOpacity",
      "strokeColor",
      "strokeOpacity",
      "strokeWidth",
      "backgroundColor",
      "backgroundOpacity",
      "cornerRadius",
      "pointerWidth",
      "pointerHeight",
      "pointerDirection",
      "position",
      "attachedTo",
      "layer",
      "locked",
      "disableHit",
      "disableAutoZIndex",
      "disableAttachmentBehavior",
      "metadata",
    ]) {
      builder[method] = vi.fn(chain);
    }
    builder.build = vi.fn(() => ({ id: "marker", metadata: {} }));
    return builder;
  };

  return {
    state,
    isAvailable: true,
    roomId: "room-test",
    onReady: vi.fn((callback: () => void) => {
      callback();
    }),
    isSceneReady: vi.fn<() => Promise<boolean>>(() => Promise.resolve(false)),
    getSelection: vi.fn(() => Promise.resolve(state.selection)),
    onPlayerChange: vi.fn(
      (callback: (player: { selection?: string[] }) => void) => {
        state.playerCallback = callback;
        return vi.fn();
      },
    ),
    getItems: vi.fn((filter?: string[]) =>
      Promise.resolve(
        Array.isArray(filter)
          ? state.items.filter((item) => filter.includes(item.id))
          : state.items,
      ),
    ),
    updateItems: vi.fn(() => Promise.resolve()),
    getItemAttachments: vi.fn(() => Promise.resolve([])),
    deleteItems: vi.fn(() => Promise.resolve()),
    getItemBounds: vi.fn(() =>
      Promise.resolve({
        min: { x: 0, y: 0 },
        max: { x: 40, y: 40 },
        width: 40,
        height: 40,
        center: { x: 20, y: 20 },
      }),
    ),
    addItems: vi.fn((items: unknown[]) => {
      state.addedItems.push(...items);
      return Promise.resolve();
    }),
    onItemsChange: vi.fn(() => vi.fn()),
    onSceneReadyChange: vi.fn(() => vi.fn()),
    onBroadcastMessage: vi.fn(
      (
        channel: string,
        callback: (event: { data: unknown; connectionId: string }) => void,
      ) => {
        state.broadcastCallbacks[channel] = callback;
        return vi.fn();
      },
    ),
    sendMessage: vi.fn<() => Promise<void>>(() => Promise.resolve()),
    showNotification: vi.fn<() => Promise<void>>(() => Promise.resolve()),
    getRoomMetadata: vi.fn<() => Promise<Record<string, unknown>>>(() =>
      Promise.resolve(state.roomMetadata),
    ),
    onRoomMetadataChange: vi.fn(() => vi.fn()),
    buildLabel: vi.fn(createLabelBuilder),
  };
});

const rosterCard = {
  id: "f15c7ec3-dad2-4f65-8b69-0f1f642c7d29",
  name: "Karg",
  className: "Hermetyczny pustelnik",
  currentHp: 2,
  maxHp: 3,
  agility: 8,
  presence: 11,
  strength: 13,
  toughness: 16,
  drToDodge: 14,
  drToMelee: 10,
  drToRanged: 11,
  omens: 1,
  maxOmens: 2,
  silver: 10,
  equippedWeapons: [{ name: "Kostur", dice: [4] }],
  equippedArmor: { name: null },
  computedModifiers: [],
  bodyDescription: "gaunt",
  trait1: "grim",
  trait2: "patient",
};

vi.mock("@/api/obr", () => ({
  fetchObrCards: obrApiMock.fetchObrCards,
  bindObrRoom: obrApiMock.bindObrRoom,
}));

vi.mock("@/hooks/useObrRole", () => ({
  useObrRole: () => routeMocks.role,
}));

vi.mock("@/CharacterContext/CharacterContext", () => ({
  useCharacter: routeMocks.useCharacter,
}));

vi.mock("@/hooks/useObrSession", () => ({
  useObrSession: routeMocks.useObrSession,
}));

vi.mock("@/hooks/usePartyRepository", () => ({
  usePromoteObrRoom: routeMocks.usePromoteObrRoom,
  usePartyLimits: routeMocks.usePartyLimits,
}));

vi.mock("@/components/organisms/CharacterSheet", () => ({
  CharacterSheet: () => <div>Player sheet</div>,
}));

vi.mock("@owlbear-rodeo/sdk", () => ({
  default: {
    get isAvailable() {
      return obrMock.isAvailable;
    },
    onReady: obrMock.onReady,
    scene: {
      isReady: obrMock.isSceneReady,
      items: {
        getItems: obrMock.getItems,
        updateItems: obrMock.updateItems,
        getItemAttachments: obrMock.getItemAttachments,
        deleteItems: obrMock.deleteItems,
        getItemBounds: obrMock.getItemBounds,
        addItems: obrMock.addItems,
        onChange: obrMock.onItemsChange,
      },
      onReadyChange: obrMock.onSceneReadyChange,
    },
    player: {
      getSelection: obrMock.getSelection,
      onChange: obrMock.onPlayerChange,
    },
    room: {
      get id() {
        return obrMock.roomId;
      },
      getMetadata: obrMock.getRoomMetadata,
      onMetadataChange: obrMock.onRoomMetadataChange,
    },
    notification: {
      show: obrMock.showNotification,
    },
    broadcast: {
      onMessage: obrMock.onBroadcastMessage,
      sendMessage: obrMock.sendMessage,
    },
  },
  buildLabel: obrMock.buildLabel,
}));

function mockCharacter(character: TestCharacter | null) {
  routeMocks.useCharacter.mockReturnValue({
    character,
    setCharacterId: routeMocks.setCharacterId,
    generateNew: routeMocks.generateNew,
  });
}

function renderRoute(queryClient = new QueryClient()) {
  return render(
    <BrowserTestProvider>
      <QueryClientProvider client={queryClient}>
        <ObrCharacterRoute />
      </QueryClientProvider>
    </BrowserTestProvider>,
  );
}

describe("ObrCharacterRoute", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    vi.clearAllMocks();
    window.history.replaceState(null, "", "/obr.html?obrref=test");
    routeMocks.role = null;
    obrMock.isAvailable = true;
    mockCharacter(null);
    obrMock.roomId = "room-test";
    obrMock.state.broadcastCallbacks = {};
    obrMock.state.roomMetadata = {};
    obrMock.state.playerCallback = null;
    obrMock.state.selection = [];
    obrMock.state.items = [];
    obrMock.state.addedItems = [];
    obrMock.isSceneReady.mockResolvedValue(false);
    obrMock.getItems.mockImplementation((filter?: string[]) =>
      Promise.resolve(
        Array.isArray(filter)
          ? obrMock.state.items.filter((item) => filter.includes(item.id))
          : obrMock.state.items,
      ),
    );
    obrApiMock.state.cards = undefined;
    routeMocks.useObrSession.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      signIn: routeMocks.signIn,
    });
    routeMocks.usePromoteObrRoom.mockReturnValue({
      data: null,
      error: null,
      isError: false,
      isPending: false,
      mutate: routeMocks.promoteRoom,
    });
    routeMocks.usePartyLimits.mockReturnValue({ data: { maxMembers: 10 } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the GM party roster without a promotion prompt for anonymous OBR GMs", async () => {
    routeMocks.role = "GM";

    await renderRoute();

    await expect
      .element(page.getByRole("main", { name: "GM party roster" }))
      .toBeVisible();
    // Promotion needs a real account and the GM view has no sign-in entry point,
    // so anonymous GMs see neither a prompt nor the save button.
    await expect
      .element(page.getByText("Sign in to save this party"))
      .not.toBeInTheDocument();
    await expect
      .element(page.getByRole("button", { name: "Move party to scvmrack" }))
      .not.toBeInTheDocument();
    expect(routeMocks.useCharacter).not.toHaveBeenCalled();
    // Wired through the roster's promotion panel. Not asserting an exact count:
    // capturing OBR.room.id into state triggers a mount re-render.
    expect(routeMocks.useObrSession).toHaveBeenCalled();
  });

  it("lets an authenticated GM promote the OBR room", async () => {
    routeMocks.role = "GM";
    obrMock.roomId = "room-1";
    routeMocks.useObrSession.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      signIn: routeMocks.signIn,
    });

    await renderRoute();

    const button = page.getByRole("button", { name: "Move party to scvmrack" });
    await expect.element(button).toBeVisible();
    await userEvent.click(button);

    expect(routeMocks.promoteRoom).toHaveBeenCalledWith({
      obrRoomId: "room-1",
      name: "Owlbear room party",
    });
  });

  it("shows saved party links after an OBR room is promoted", async () => {
    routeMocks.role = "GM";
    routeMocks.useObrSession.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      signIn: routeMocks.signIn,
    });
    routeMocks.usePromoteObrRoom.mockReturnValue({
      data: {
        id: "party-1",
        name: "Owlbear room party",
        inviteToken: "tok",
        invitePath: "/join/tok",
        memberCount: 0,
        maxMembers: 10,
        createdAt: "2026-06-27T00:00:00.000Z",
        updatedAt: "2026-06-27T00:00:00.000Z",
        role: "gm",
        members: [],
      },
      error: null,
      isError: false,
      isPending: false,
      mutate: routeMocks.promoteRoom,
    });

    await renderRoute();

    await expect
      .element(page.getByRole("link", { name: "Invite /join/tok" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("link", { name: "Manage in scvmrack" }))
      .toBeVisible();
  });

  it("refreshes the GM roster after a delayed OBR roster pulse scan", async () => {
    routeMocks.role = "GM";
    obrApiMock.state.cards = [rosterCard];

    await renderRoute();

    await expect
      .element(
        page.getByText(
          "No bound scvm yet. Players must bind a scvm to a token.",
        ),
      )
      .toBeVisible();
    expect(
      obrMock.state.broadcastCallbacks["co.rpgtools.scvmrack/roster"],
    ).toEqual(expect.any(Function));

    obrMock.isSceneReady.mockResolvedValue(true);
    obrMock.getItems
      .mockResolvedValueOnce([])
      .mockResolvedValue([
        { id: "token-1", metadata: { [CHARACTER_META_KEY]: rosterCard.id } },
      ]);

    obrMock.state.broadcastCallbacks["co.rpgtools.scvmrack/roster"]?.({
      data: { kind: "roster" },
      connectionId: "remote",
    });

    await expect
      .poll(() => obrMock.getItems.mock.calls.length)
      .toBeGreaterThanOrEqual(2);
    await expect
      .poll(() =>
        obrApiMock.fetchObrCards.mock.calls.some(
          ([ids, roomId]) =>
            Array.isArray(ids) &&
            ids.includes(rosterCard.id) &&
            roomId === "room-test",
        ),
      )
      .toBe(true);
    await expect.element(page.getByText("Karg")).toBeVisible();
  });

  it("keeps the player sheet flow for OBR players", async () => {
    routeMocks.role = "PLAYER";

    await renderRoute();

    await expect.element(page.getByText("Roll a scvm")).toBeVisible();
    expect(routeMocks.useCharacter).toHaveBeenCalledOnce();
    expect(routeMocks.useObrSession).toHaveBeenCalledOnce();
  });

  it("disables OBR token binding until a token is selected", async () => {
    routeMocks.role = "PLAYER";
    mockCharacter({
      id: "f15c7ec3-dad2-4f65-8b69-0f1f642c7d29",
      name: "Karg",
      updatedAt: "2026-06-27T12:00:00.000Z",
    });

    await renderRoute();

    await expect.element(page.getByText("No token selected")).toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "Select token to bind" }))
      .toBeDisabled();
  });

  it("changes the OBR token action to re-bind when the selected token is bound", async () => {
    routeMocks.role = "PLAYER";
    obrMock.state.selection = ["token-1"];
    obrMock.state.items = [
      {
        id: "token-1",
        metadata: {
          [CHARACTER_META_KEY]: "already-bound-character",
        },
      },
    ];
    mockCharacter({
      id: "f15c7ec3-dad2-4f65-8b69-0f1f642c7d29",
      name: "Karg",
      updatedAt: "2026-06-27T12:00:00.000Z",
    });

    await renderRoute();

    await expect.element(page.getByText("Bound token selected")).toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "Re-bind selected token" }))
      .not.toBeDisabled();
  });

  it("waits instead of showing the player flow while the OBR role is pending", async () => {
    await renderRoute();

    await expect
      .element(page.getByLabelText("Checking Owlbear role"))
      .toBeVisible();
    expect(routeMocks.useCharacter).not.toHaveBeenCalled();
    expect(routeMocks.useObrSession).not.toHaveBeenCalled();
  });

  it("explains when the OBR entry is opened outside Owlbear", async () => {
    window.history.replaceState(null, "", "/obr.html");
    obrMock.isAvailable = false;

    await renderRoute();

    await expect
      .element(
        page.getByText(
          "Open Scvmrack from Owlbear Rodeo to read the room role.",
        ),
      )
      .toBeVisible();
    expect(routeMocks.useCharacter).not.toHaveBeenCalled();
    expect(routeMocks.useObrSession).not.toHaveBeenCalled();
  });

  it("broadcasts a card refresh after an active OBR character changes", async () => {
    routeMocks.role = "PLAYER";
    const queryClient = new QueryClient();
    mockCharacter({
      id: "f15c7ec3-dad2-4f65-8b69-0f1f642c7d29",
      name: "Karg",
      updatedAt: "2026-06-27T12:00:00.000Z",
    });

    const view = await renderRoute(queryClient);

    await expect.element(page.getByText("Player sheet")).toBeVisible();
    expect(obrMock.sendMessage).not.toHaveBeenCalled();

    mockCharacter({
      id: "f15c7ec3-dad2-4f65-8b69-0f1f642c7d29",
      name: "Karg",
      updatedAt: "2026-06-27T12:00:01.000Z",
    });
    await view.rerender(
      <BrowserTestProvider>
        <QueryClientProvider client={queryClient}>
          <ObrCharacterRoute />
        </QueryClientProvider>
      </BrowserTestProvider>,
    );

    await expect
      .poll(() => obrMock.sendMessage)
      .toHaveBeenCalledWith(
        "co.rpgtools.scvmrack/roster",
        {
          kind: "card",
          characterId: "f15c7ec3-dad2-4f65-8b69-0f1f642c7d29",
        },
        { destination: "ALL" },
      );
  });
});
