import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BrowserTestProvider from "./BrowserTestProvider";
import {
  ObrPartyRoster,
  type ObrPartyRosterCard,
} from "@/components/obr/ObrPartyRoster";
import { ObrRoomPromotion } from "@/components/obr/ObrRoomPromotion";
import {
  attachPartyRoom,
  getParty,
  listParties,
  partyKeys,
  type OwnedPartySummary,
  type PartyDetail,
} from "@/api/party";
import i18n from "@/i18n";

const ROOM_ID = "room-test";
const obrRoomMock = vi.hoisted(() => ({ roomId: "room-test" }));

vi.mock("@/api/party", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/party")>()),
  listParties: vi.fn(),
  attachPartyRoom: vi.fn(),
  getParty: vi.fn(),
}));

vi.mock("@owlbear-rodeo/sdk", () => ({
  default: {
    room: {
      get id() {
        return obrRoomMock.roomId;
      },
    },
    notification: {
      show: vi.fn(() => Promise.resolve()),
    },
  },
  buildLabel: vi.fn(),
}));

const sampleCard: ObrPartyRosterCard = {
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
    {
      originName: "Shield",
      statistic: "agility",
      source: "Shield bonus",
      value: 1,
    },
  ],
  bodyDescription: "gaunt",
  trait1: "grim",
  trait2: "patient",
};
// sampleCard.id is typed string | null | undefined (OpenAPI-generated), but
// this fixture always sets a literal id — narrow it once for row/binding use.
const cardId = sampleCard.id as string;

describe("ObrPartyRoster", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("renders the GM roster header and compact card rows", async () => {
    await render(
      <BrowserTestProvider>
        <ObrPartyRoster cards={[sampleCard]} maxMembers={8} />
      </BrowserTestProvider>,
    );

    await expect.element(page.getByText("GM · OVERVIEW 1/8")).toBeVisible();
    await expect.element(page.getByText("Karg")).toBeVisible();
    await expect.element(page.getByText("Hermetyczny pustelnik")).toBeVisible();
    await expect.element(page.getByRole("progressbar")).toBeVisible();
    await expect.element(page.getByText("2/3")).toBeVisible();
    await expect.element(page.getByText("DOD")).toBeVisible();
    await expect.element(page.getByText("MEL")).toBeVisible();
    await expect.element(page.getByText("RNG")).toBeVisible();
    await expect.element(page.getByText("DR")).toBeVisible();
  });

  it("expands computed modifiers from the Mods control", async () => {
    await render(
      <BrowserTestProvider>
        <ObrPartyRoster cards={[sampleCard]} />
      </BrowserTestProvider>,
    );

    const modyButton = page.getByRole("button", {
      name: /toggle karg detail/i,
    });
    await expect.element(modyButton).toBeVisible();
    await userEvent.click(modyButton);

    await expect.element(page.getByText("Heavy armor")).toBeVisible();
    await expect.element(page.getByText("−1 AGILITY")).toBeVisible();
    await expect.element(page.getByText("Shield")).toBeVisible();
    await expect.element(page.getByText("+1 AGILITY")).toBeVisible();
    await expect.element(page.getByText("Leather armor (−d2)")).toBeVisible();
  });

  it("renders an empty roster state while scene wiring is absent", async () => {
    await render(
      <BrowserTestProvider>
        <ObrPartyRoster cards={[]} maxMembers={8} />
      </BrowserTestProvider>,
    );

    await expect.element(page.getByText("GM · OVERVIEW 0/8")).toBeVisible();
    await expect
      .element(
        page.getByText(
          "No bound scvm yet. Players must bind a scvm to a token.",
        ),
      )
      .toBeVisible();
  });

  it("shows a divider between adjacent scvm entries but not above the first (RPG-59)", async () => {
    await render(
      <BrowserTestProvider>
        <ObrPartyRoster
          rows={[
            { id: cardId, characterId: cardId, card: sampleCard, players: [], tokens: [] },
            {
              id: "second-scvm",
              characterId: "second-scvm",
              card: { ...sampleCard, id: "second-scvm", name: "Brenna" },
              players: [],
              tokens: [],
            },
          ]}
          maxMembers={8}
        />
      </BrowserTestProvider>,
    );

    const entries = page.getByRole("listitem").elements();
    expect(entries).toHaveLength(2);
    expect(getComputedStyle(entries[0]).borderTopWidth).toBe("0px");
    expect(getComputedStyle(entries[1]).borderTopWidth).not.toBe("0px");
  });

  it("renders durable binding controls for GM token and player recovery", async () => {
    const bindSelectedToken = vi.fn(() => Promise.resolve());
    const assignPlayer = vi.fn(() => Promise.resolve());
    const unassignPlayer = vi.fn(() => Promise.resolve());
    const unbindToken = vi.fn(() => Promise.resolve());

    await render(
      <BrowserTestProvider>
        <ObrPartyRoster
          rows={[
            {
              id: cardId,
              characterId: cardId,
              card: sampleCard,
              players: [
                {
                  playerId: "player-new",
                  connectionId: null,
                  characterId: cardId,
                  assignedByPlayerId: "player-new",
                  stale: false,
                },
              ],
              tokens: [
                {
                  tokenId: "token-1",
                  playerId: "player-new",
                  characterId: cardId,
                  stale: false,
                },
              ],
            },
          ]}
          maxMembers={8}
          connectedPlayers={[
            {
              id: "player-new",
              connectionId: "conn-new",
              name: "Ada",
              role: "PLAYER",
              connected: true,
            },
            {
              id: "player-two",
              connectionId: "conn-two",
              name: "Beata",
              role: "PLAYER",
              connected: true,
            },
          ]}
          action={{ pending: false, message: null, error: null }}
          bindSelectedToken={bindSelectedToken}
          assignPlayer={assignPlayer}
          unassignPlayer={unassignPlayer}
          unbindToken={unbindToken}
        />
      </BrowserTestProvider>,
    );

    await expect.element(page.getByText("Player Ada")).toBeVisible();

    await userEvent.click(
      page.getByRole("button", { name: "Bind selected token" }),
    );
    await page
      .getByRole("combobox", { name: "Assign to player" })
      .selectOptions("player-two");
    await userEvent.click(page.getByRole("button", { name: "Clear" }));
    await userEvent.click(page.getByRole("button", { name: "Unbind" }));

    expect(bindSelectedToken).toHaveBeenCalledWith({
      characterId: cardId,
      characterName: "Karg",
      playerId: "player-new",
    });
    expect(assignPlayer).toHaveBeenCalledWith({
      characterId: cardId,
      playerId: "player-two",
    });
    expect(unassignPlayer).toHaveBeenCalledWith("player-new");
    expect(unbindToken).toHaveBeenCalledWith("token-1");
  });

  it("keeps cleanup controls visible for stale backend bindings", async () => {
    await render(
      <BrowserTestProvider>
        <ObrPartyRoster
          rows={[
            {
              id: "missing-character",
              characterId: "missing-character",
              card: null,
              players: [
                {
                  playerId: "player-lost",
                  connectionId: null,
                  characterId: "missing-character",
                  assignedByPlayerId: "player-lost",
                  stale: false,
                },
              ],
              tokens: [
                {
                  tokenId: "token-stale",
                  playerId: "player-lost",
                  characterId: "missing-character",
                  stale: false,
                },
              ],
            },
          ]}
          maxMembers={8}
          unassignPlayer={() => Promise.resolve()}
          unbindToken={() => Promise.resolve()}
        />
      </BrowserTestProvider>,
    );

    await expect
      .element(page.getByText("Scvm not found missing-character"))
      .toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "Clear" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "Unbind" }))
      .toBeVisible();
  });

  it("removes a scvm from the roster in one action, no confirmation dialog", async () => {
    const onRemoveFromRoster = vi.fn(() => Promise.resolve());

    await render(
      <BrowserTestProvider>
        <ObrPartyRoster
          rows={[
            {
              id: cardId,
              characterId: cardId,
              card: sampleCard,
              players: [],
              tokens: [],
            },
          ]}
          maxMembers={8}
          onRemoveFromRoster={onRemoveFromRoster}
        />
      </BrowserTestProvider>,
    );

    await userEvent.click(
      page.getByRole("button", { name: "Remove from roster" }),
    );

    expect(onRemoveFromRoster).toHaveBeenCalledWith(cardId);
  });

  it("surfaces a remove-from-roster failure via the roster error banner", async () => {
    await render(
      <BrowserTestProvider>
        <ObrPartyRoster
          rows={[
            {
              id: cardId,
              characterId: cardId,
              card: sampleCard,
              players: [],
              tokens: [],
            },
          ]}
          maxMembers={8}
          onRemoveFromRoster={() => Promise.resolve()}
          removeRosterAction={{
            characterId: cardId,
            pending: false,
            error: "Could not remove Karg from the party",
          }}
        />
      </BrowserTestProvider>,
    );

    await expect
      .element(page.getByText("Could not remove Karg from the party"))
      .toBeVisible();
  });

  it("refreshes the roster on demand so invite-link joins become visible", async () => {
    const onRefresh = vi.fn(() => Promise.resolve());

    await render(
      <BrowserTestProvider>
        <ObrPartyRoster
          cards={[]}
          maxMembers={8}
          action={{ pending: false, message: null, error: null }}
          onRefresh={onRefresh}
        />
      </BrowserTestProvider>,
    );

    await userEvent.click(page.getByRole("button", { name: "Refresh" }));

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("shows a stale badge and clears a durable player binding whose player left the room", async () => {
    const unassignPlayer = vi.fn(() => Promise.resolve());

    await render(
      <BrowserTestProvider>
        <ObrPartyRoster
          rows={[
            {
              id: cardId,
              characterId: cardId,
              card: sampleCard,
              players: [
                {
                  playerId: "player-gone",
                  connectionId: null,
                  characterId: cardId,
                  assignedByPlayerId: "player-gone",
                  stale: true,
                },
              ],
              tokens: [],
            },
          ]}
          maxMembers={8}
          connectedPlayers={[
            {
              id: "player-here",
              connectionId: "conn-here",
              name: "Csaba",
              role: "PLAYER",
              connected: true,
            },
          ]}
          action={{ pending: false, message: null, error: null }}
          unassignPlayer={unassignPlayer}
        />
      </BrowserTestProvider>,
    );

    await expect
      .element(page.getByText("STALE — not in room"))
      .toBeVisible();

    await userEvent.click(page.getByRole("button", { name: "Clear" }));

    expect(unassignPlayer).toHaveBeenCalledWith("player-gone");
  });
});

describe("ObrRoomPromotion", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    obrRoomMock.roomId = ROOM_ID;
    vi.mocked(listParties).mockReset();
    vi.mocked(attachPartyRoom).mockReset();
    vi.mocked(getParty).mockReset();
  });

  it("shows the room party without invite controls when the caller is not the owner", async () => {
    const queryClient = new QueryClient();
    const memberRoomParty: PartyDetail = {
      id: "party-1",
      name: "Owlbear room party",
      memberCount: 1,
      maxMembers: 10,
      createdAt: "2026-06-27T00:00:00.000Z",
      updatedAt: "2026-06-27T00:00:00.000Z",
      role: "member",
      members: [],
    };
    queryClient.setQueryData(partyKeys.obrRoom(ROOM_ID), memberRoomParty);

    await render(
      <BrowserTestProvider>
        <QueryClientProvider client={queryClient}>
          <ObrRoomPromotion />
        </QueryClientProvider>
      </BrowserTestProvider>,
    );

    await expect.element(page.getByText("Room board active")).toBeVisible();
    expect(
      page.getByRole("button", { name: /copy invite link/i }).query(),
    ).toBeNull();
  });

  it("lets a signed-in GM attach an existing warband to this room", async () => {
    const existingParty: OwnedPartySummary = {
      id: "p1",
      name: "Doomed Ones",
      inviteToken: "tok",
      invitePath: "/join/tok",
      memberCount: 1,
      maxMembers: 10,
      createdAt: "2026-06-27T00:00:00.000Z",
      updatedAt: "2026-06-27T00:00:00.000Z",
    };
    const gmPartyDetail: PartyDetail = {
      id: "p1",
      name: "Doomed Ones",
      memberCount: 1,
      maxMembers: 10,
      createdAt: "2026-06-27T00:00:00.000Z",
      updatedAt: "2026-06-27T00:00:00.000Z",
      role: "gm",
      members: [],
      inviteToken: "tok",
      invitePath: "/join/tok",
    };
    vi.mocked(listParties).mockResolvedValue([existingParty]);
    vi.mocked(attachPartyRoom).mockResolvedValue({
      id: "p1",
      obrRoomId: ROOM_ID,
    });
    vi.mocked(getParty).mockResolvedValue(gmPartyDetail);

    const queryClient = new QueryClient();

    await render(
      <BrowserTestProvider>
        <QueryClientProvider client={queryClient}>
          <ObrRoomPromotion />
        </QueryClientProvider>
      </BrowserTestProvider>,
    );

    await page
      .getByRole("combobox", { name: /use an existing warband/i })
      .selectOptions("p1");
    await userEvent.click(
      page.getByRole("button", { name: /use this room/i }),
    );

    await expect.element(page.getByText(/invite/i)).toBeVisible();
    expect(attachPartyRoom).toHaveBeenCalledWith("p1", ROOM_ID);
    expect(getParty).toHaveBeenCalledWith("p1");
  });
});
