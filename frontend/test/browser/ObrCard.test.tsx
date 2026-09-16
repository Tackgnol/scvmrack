import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ObrCard,
  ObrCardRoute,
  type ObrCardCharacter,
} from "@/components/obr/ObrCard";
import { SCVM_CARD_POPOVER_ID } from "@/obr/contextMenu";
import {
  CHARACTER_META_KEY,
  TOKEN_MARKER_META_KEY,
} from "@/obr/extension";
import i18n from "@/i18n";
import BrowserTestProvider from "./BrowserTestProvider";

type TestItem = {
  id: string;
  metadata: Record<string, unknown>;
};

const sampleCard: ObrCardCharacter = {
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
  equippedArmor: { name: "Leather armor", dice: [2] },
  computedModifiers: [
    {
      originName: "Heavy armor",
      statistic: "agility",
      source: "Heavy armor penalty",
      value: -1,
    },
  ],
  bodyDescription: "gaunt",
  trait1: "grim",
  trait2: "patient",
};

const obrApiMock = vi.hoisted(() => ({
  fetchObrCards: vi.fn<() => Promise<import("@/components/obr/ObrCard").ObrCardCharacter[]>>(
    () => Promise.resolve([]),
  ),
}));

const obrMock = vi.hoisted(() => {
  const state = {
    items: [] as TestItem[],
    attachments: [] as TestItem[],
  };

  return {
    state,
    getRole: vi.fn<() => Promise<"GM" | "PLAYER">>(() =>
      Promise.resolve("GM"),
    ),
    updateItems: vi.fn(
      async (ids: string[], update: (items: TestItem[]) => void) => {
        update(state.items.filter((item) => ids.includes(item.id)));
      },
    ),
    getItemAttachments: vi.fn(() => Promise.resolve(state.attachments)),
    deleteItems: vi.fn<() => Promise<void>>(() => Promise.resolve()),
    sendMessage: vi.fn<() => Promise<void>>(() => Promise.resolve()),
    showNotification: vi.fn<() => Promise<void>>(() => Promise.resolve()),
    closePopover: vi.fn<() => Promise<void>>(() => Promise.resolve()),
  };
});

vi.mock("@/api/obr", () => ({
  fetchObrCards: obrApiMock.fetchObrCards,
  // ObrCard imports @/obr/contextMenu, which now shares roomBinding.ts's
  // helpers; these binder calls are unused in this test's flow, so no-op
  // stubs are enough to satisfy the module graph.
  bindObrPlayerCharacter: vi.fn(),
  bindObrTokenCharacter: vi.fn(),
  clearObrPlayerCharacter: vi.fn(),
  clearObrTokenCharacter: vi.fn(),
  fetchObrRoomBindings: vi.fn(),
}));

vi.mock("@owlbear-rodeo/sdk", () => ({
  default: {
    player: {
      getRole: obrMock.getRole,
    },
    scene: {
      items: {
        updateItems: obrMock.updateItems,
        getItemAttachments: obrMock.getItemAttachments,
        deleteItems: obrMock.deleteItems,
      },
    },
    broadcast: {
      sendMessage: obrMock.sendMessage,
    },
    notification: {
      show: obrMock.showNotification,
    },
    popover: {
      close: obrMock.closePopover,
    },
  },
  buildLabel: vi.fn(),
}));

function renderCard() {
  return render(
    <BrowserTestProvider>
      <QueryClientProvider client={new QueryClient()}>
        <ObrCardRoute
          characterId="f15c7ec3-dad2-4f65-8b69-0f1f642c7d29"
          roomId="room-1"
          tokenId="token-1"
        />
      </QueryClientProvider>
    </BrowserTestProvider>,
  );
}

describe("ObrCardRoute", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    vi.clearAllMocks();
    obrApiMock.fetchObrCards.mockResolvedValue([]);
    obrMock.getRole.mockResolvedValue("GM");
    obrMock.state.items = [
      {
        id: "token-1",
        metadata: { [CHARACTER_META_KEY]: "missing-character" },
      },
    ];
    obrMock.state.attachments = [
      { id: "marker-1", metadata: { [TOKEN_MARKER_META_KEY]: true } },
    ];
  });

  it("renders a compact table-visible character card", async () => {
    await render(
      <BrowserTestProvider>
        <ObrCard card={sampleCard} />
      </BrowserTestProvider>,
    );

    await expect.element(page.getByTestId("warband-card")).toBeVisible();
    await expect.element(page.getByText("Karg")).toBeVisible();
    await expect.element(page.getByText("Hermetyczny pustelnik")).toBeVisible();
    await expect
      .element(page.getByRole("progressbar", { name: "Hit points" }))
      .toBeVisible();
    await expect.element(page.getByText("2/3")).toBeVisible();
    await expect.element(page.getByText("1/2")).toBeVisible();
    await expect.element(page.getByText("Kostur (d4)")).toBeVisible();
    await expect.element(page.getByText("Leather armor (−d2)")).toBeVisible();
    await expect.element(page.getByText("Heavy armor")).toBeVisible();
    await expect.element(page.getByText("−1 AGILITY")).toBeVisible();
  });

  it("renders a compact status state when the bound card is stale", async () => {
    await render(
      <BrowserTestProvider>
        <ObrCard card={null} error="NIE ZNALEZIONO SCVM" />
      </BrowserTestProvider>,
    );

    await expect.element(page.getByRole("status")).toBeVisible();
    await expect.element(page.getByText("NIE ZNALEZIONO SCVM")).toBeVisible();
  });

  it("REGRESSION: keeps the previous card visible while a locale switch refetches (RPG-56)", async () => {
    obrApiMock.fetchObrCards.mockResolvedValueOnce([sampleCard]);
    await renderCard();

    await expect.element(page.getByText("Karg")).toBeVisible();

    let resolveSecondFetch: (cards: ObrCardCharacter[]) => void;
    obrApiMock.fetchObrCards.mockReturnValueOnce(
      new Promise<ObrCardCharacter[]>((resolve) => {
        resolveSecondFetch = resolve;
      }),
    );

    await i18n.changeLanguage("pl");

    // The query key is locale-dependent (`["obr","cards",room,ids,locale]`), so
    // without `placeholderData` this refetch would blank `.data` and briefly
    // render the loading skeleton instead of the still-valid previous card.
    await expect.element(page.getByText("Karg")).toBeVisible();
    await expect.element(page.getByRole("status")).not.toBeInTheDocument();

    resolveSecondFetch!([{ ...sampleCard, name: "Karg PL" }]);
    await expect.element(page.getByText("Karg PL")).toBeVisible();
  });

  it("lets a GM unbind a token when the scvm card is not found", async () => {
    await renderCard();

    await expect.element(page.getByText("Scvm not found")).toBeVisible();
    await userEvent.click(page.getByRole("button", { name: "Unbind token" }));

    expect(obrMock.state.items[0].metadata).not.toHaveProperty(
      CHARACTER_META_KEY,
    );
    await expect
      .poll(() => obrMock.deleteItems)
      .toHaveBeenCalledWith(["marker-1"]);
    await expect
      .poll(() => obrMock.sendMessage)
      .toHaveBeenCalledWith(
        "co.rpgtools.scvmrack/roster",
        { kind: "roster" },
        { destination: "ALL" },
      );
    await expect
      .poll(() => obrMock.showNotification)
      .toHaveBeenCalledWith("Token unbound", "SUCCESS");
    await expect
      .poll(() => obrMock.closePopover)
      .toHaveBeenCalledWith(SCVM_CARD_POPOVER_ID);
  });
});
