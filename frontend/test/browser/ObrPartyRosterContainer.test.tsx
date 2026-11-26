import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BrowserTestProvider from "./BrowserTestProvider";
import { ObrPartyRosterContainer } from "@/components/obr/ObrPartyRosterContainer";

const mocks = vi.hoisted(() => ({ roster: vi.fn() }));

vi.mock("@/obr/useObrRosterCards", () => ({
  useObrRosterCards: mocks.roster,
}));
vi.mock("@/hooks/usePartyRepository", () => ({
  usePartyLimits: () => ({ data: { maxMembers: 10 } }),
}));
vi.mock("@/components/obr/ObrRoomPromotion", () => ({
  ObrRoomPromotion: () => null,
}));

function roster(canManage: boolean) {
  const noop = vi.fn().mockResolvedValue(undefined);
  mocks.roster.mockReturnValue({
    canManage,
    rows: [
      {
        id: "row-1",
        characterId: "char-1",
        card: null,
        players: [],
        tokens: [],
      },
    ],
    connectedPlayers: [],
    action: { pending: false, message: null, error: null },
    refresh: noop,
    bindSelectedToken: noop,
    assignPlayer: noop,
    unassignPlayer: noop,
    unbindToken: noop,
    removeFromRoster: noop,
    removeRosterAction: null,
    cleanupMessage: null,
    cleanupPending: false,
    retrySceneCleanup: noop,
  });
}

describe("ObrPartyRosterContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("hides the owner-only roster controls from a visitor who cannot manage the party (RPG-390)", async () => {
    roster(false);
    render(
      <BrowserTestProvider>
        <ObrPartyRosterContainer />
      </BrowserTestProvider>,
    );

    await expect
      .element(page.getByRole("button", { name: "Refresh" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "Remove from roster" }))
      .not.toBeInTheDocument();
    await expect
      .element(page.getByRole("button", { name: "Bind selected token" }))
      .not.toBeInTheDocument();
  });

  it("shows the roster controls to the owner", async () => {
    roster(true);
    render(
      <BrowserTestProvider>
        <ObrPartyRosterContainer />
      </BrowserTestProvider>,
    );

    await expect
      .element(page.getByRole("button", { name: "Remove from roster" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "Bind selected token" }))
      .toBeVisible();
  });
});
