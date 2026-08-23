import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BrowserTestProvider from "./BrowserTestProvider";
import { ObrEnemiesPanel, ObrEnemyWindow } from "@/components/obr/ObrEnemies";
import type { ObrEnemy } from "@/obr/enemies";
import i18n from "@/i18n";

const roleMock = vi.hoisted(() => ({
  role: "PLAYER" as "GM" | "PLAYER" | null,
}));

const obrMock = vi.hoisted(() => ({
  show: vi.fn<(...args: unknown[]) => Promise<void>>(() => Promise.resolve()),
  onReady: vi.fn((callback: () => void) => {
    callback();
  }),
}));

const enemiesMock = vi.hoisted(() => ({
  enemies: [] as ObrEnemy[],
  isReady: true,
  error: null as Error | null,
  refresh: vi.fn(),
  saveEnemy: vi.fn((enemy: ObrEnemy) => Promise.resolve(enemy)),
  deleteEnemy: vi.fn(() => Promise.resolve()),
  updateEnemyHealth: vi.fn(() => Promise.resolve(null)),
  bindEnemy: vi.fn(() => Promise.resolve(0)),
}));

const sessionMock = vi.hoisted(() => ({
  isLoading: false,
  isAuthenticated: true,
  signIn: vi.fn<() => Promise<void>>(() => Promise.resolve()),
}));

const partyMock = vi.hoisted(() => ({
  roomParty: {
    id: "party-1",
    name: "Owlbear room party",
    inviteToken: "invite",
    invitePath: "/join/invite",
    memberCount: 0,
    maxMembers: 10,
    createdAt: "2026-06-29T00:00:00.000Z",
    updatedAt: "2026-06-29T00:00:00.000Z",
    role: "gm",
    members: [],
  } as unknown,
  promote: {
    data: null as unknown,
    error: null as unknown,
    isError: false,
    isPending: false,
    mutate: vi.fn(),
  },
}));

vi.mock("@owlbear-rodeo/sdk", () => ({
  default: {
    onReady: obrMock.onReady,
    room: {
      id: "room-1",
    },
    notification: {
      show: obrMock.show,
    },
    scene: {
      isReady: vi.fn(() => Promise.resolve(false)),
      onReadyChange: vi.fn(() => () => {}),
      items: {
        getItems: vi.fn(() => Promise.resolve([])),
        onChange: vi.fn(() => () => {}),
        updateItems: vi.fn(() => Promise.resolve()),
      },
    },
    player: {
      getSelection: vi.fn(() => Promise.resolve([])),
      select: vi.fn(() => Promise.resolve()),
    },
  },
  buildLabel: vi.fn(),
}));

vi.mock("@/hooks/useObrRole", () => ({
  useObrRole: () => roleMock.role,
}));

vi.mock("@/obr/useObrEnemies", () => ({
  useObrEnemies: () => enemiesMock,
}));

vi.mock("@/obr/useObrSession", () => ({
  useObrSession: () => sessionMock,
}));

vi.mock("@/hooks/usePartyRepository", () => ({
  useObrRoomParty: () => ({ data: partyMock.roomParty }),
  usePromoteObrRoom: () => partyMock.promote,
}));

const sampleEnemy: ObrEnemy = {
  id: "enemy-1",
  name: "Ash Wight",
  type: "Undead",
  habitat: "Ash chapel",
  description: "It remembers the reliquary route.",
  playerDescription: "Grey ash falls from its mouth.",
  currentHealth: 5,
  healthPercent: 63,
  maxHealth: 8,
  morale: 7,
  armorDie: "-d2",
  armorDescription: "Soot-caked bones",
  attacks: [{ id: "attack-1", name: "Ash claw", die: "d6" }],
  specials: [
    {
      id: "special-1",
      name: "Choking ash",
      description: "Presence DR12 or cough blood.",
    },
  ],
  loot: [{ id: "loot-1", label: "Relic ash", value: "20s" }],
  statuses: [
    { id: "death", percent: 25, label: "At death's door" },
    { id: "wounded", percent: 75, label: "Wounded" },
    { id: "healthy", percent: 100, label: "Healthy" },
  ],
};

describe("ObrEnemiesPanel", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    vi.clearAllMocks();
    enemiesMock.enemies = [];
    enemiesMock.isReady = true;
    enemiesMock.error = null;
    enemiesMock.saveEnemy.mockImplementation((enemy: ObrEnemy) =>
      Promise.resolve(enemy),
    );
    enemiesMock.deleteEnemy.mockResolvedValue(undefined);
    enemiesMock.updateEnemyHealth.mockResolvedValue(null);
    enemiesMock.bindEnemy.mockResolvedValue(0);
    roleMock.role = "PLAYER";
    sessionMock.isLoading = false;
    sessionMock.isAuthenticated = true;
    sessionMock.signIn.mockResolvedValue(undefined);
    partyMock.roomParty = {
      id: "party-1",
      name: "Owlbear room party",
      inviteToken: "invite",
      invitePath: "/join/invite",
      memberCount: 0,
      maxMembers: 10,
      createdAt: "2026-06-29T00:00:00.000Z",
      updatedAt: "2026-06-29T00:00:00.000Z",
      role: "gm",
      members: [],
    };
    partyMock.promote.data = null;
    partyMock.promote.error = null;
    partyMock.promote.isError = false;
    partyMock.promote.isPending = false;
  });

  it("renders the player enemy popover with resolved status", async () => {
    roleMock.role = "PLAYER";
    enemiesMock.enemies = [sampleEnemy];

    await render(
      <BrowserTestProvider>
        <ObrEnemyWindow
          enemyId={sampleEnemy.id}
          roomId="room-1"
          characterId="11111111-1111-4111-8111-111111111111"
        />
      </BrowserTestProvider>,
    );

    await expect
      .element(page.getByText("Enemies 1"))
      .not.toBeInTheDocument();
    await expect.element(page.getByText("Ash Wight")).toBeVisible();
    await expect.element(page.getByText("Wounded")).toBeVisible();
    await expect.element(page.getByRole("progressbar")).toBeVisible();
    await expect.element(page.getByText("63% health")).toBeVisible();
    await expect
      .element(page.getByText("Grey ash falls from its mouth."))
      .toBeVisible();
  });

  it("sets up the room enemy board automatically for anonymous OBR GMs", async () => {
    sessionMock.isAuthenticated = false;
    partyMock.roomParty = null;

    await render(
      <BrowserTestProvider>
        <ObrEnemiesPanel viewerRole="GM" roomId="room-1" />
      </BrowserTestProvider>,
    );

    await expect
      .element(page.getByText("Setting up enemy board"))
      .toBeVisible();
    await expect
      .element(page.getByText("Move room before enemies"))
      .not.toBeInTheDocument();
    await expect
      .element(page.getByRole("button", { name: "New enemy" }))
      .not.toBeInTheDocument();

    expect(sessionMock.signIn).not.toHaveBeenCalled();
    await expect
      .poll(() => partyMock.promote.mutate)
      .toHaveBeenCalledWith({
        obrRoomId: "room-1",
        name: "Owlbear room party",
      });
  });

  it("lets GMs retry room enemy board setup after a setup failure", async () => {
    partyMock.roomParty = null;
    partyMock.promote.isError = true;
    partyMock.promote.error = new Error("backend down");

    await render(
      <BrowserTestProvider>
        <ObrEnemiesPanel viewerRole="GM" roomId="room-1" />
      </BrowserTestProvider>,
    );

    await expect
      .element(page.getByText("Enemy board setup failed"))
      .toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "New enemy" }))
      .not.toBeInTheDocument();

    await userEvent.click(
      page.getByRole("button", { name: "Retry setup" }),
    );

    expect(partyMock.promote.mutate).toHaveBeenCalledWith({
      obrRoomId: "room-1",
      name: "Owlbear room party",
    });
  });

  it("renders the GM enemy window as an editable monster form", async () => {
    roleMock.role = "GM";
    enemiesMock.enemies = [sampleEnemy];

    await render(
      <BrowserTestProvider>
        <ObrEnemyWindow enemyId={sampleEnemy.id} />
      </BrowserTestProvider>,
    );

    await expect.element(page.getByLabelText("Name")).toBeVisible();
    await expect.element(page.getByLabelText("Type")).toBeVisible();
    await expect.element(page.getByLabelText("GM description")).toBeVisible();
    await expect
      .element(page.getByLabelText("Player description"))
      .toBeVisible();

    await userEvent.fill(page.getByLabelText("Name"), "Ash Wight Prime");
    await userEvent.click(page.getByRole("button", { name: "Save enemy" }));

    await expect
      .poll(() => enemiesMock.saveEnemy)
      .toHaveBeenCalledWith(
        expect.objectContaining({
          id: sampleEnemy.id,
          name: "Ash Wight Prime",
          type: "Undead",
          description: "It remembers the reliquary route.",
          playerDescription: "Grey ash falls from its mouth.",
          currentHealth: 5,
        }),
      );
  });

  it("does not show raw session errors when an enemy save is rejected", async () => {
    enemiesMock.saveEnemy.mockRejectedValueOnce(
      Object.assign(new Error("Session required"), {
        code: "SESSION_REQUIRED",
        status: 401,
      }),
    );

    await render(
      <BrowserTestProvider>
        <ObrEnemiesPanel viewerRole="GM" roomId="room-1" />
      </BrowserTestProvider>,
    );

    await userEvent.click(page.getByRole("button", { name: "New enemy" }));
    await userEvent.fill(page.getByLabelText("Name"), "Carrion Saint");
    await userEvent.click(page.getByRole("button", { name: "Save enemy" }));

    await expect
      .element(page.getByText("Sign in to save enemies for this Owlbear room."))
      .toBeVisible();
    await expect
      .element(page.getByText("Session required"))
      .not.toBeInTheDocument();
  });

  it("submits the GM create form through react-hook-form and zod", async () => {
    await render(
      <BrowserTestProvider>
        <ObrEnemiesPanel viewerRole="GM" roomId="room-1" />
      </BrowserTestProvider>,
    );

    await userEvent.click(page.getByRole("button", { name: "New enemy" }));
    await userEvent.fill(page.getByLabelText("Name"), "Carrion Saint");
    await userEvent.fill(page.getByLabelText("Type"), "Corpse saint");
    await userEvent.fill(page.getByLabelText("Habitat"), "Road shrine");
    await userEvent.fill(
      page.getByRole("textbox", { name: "Attack" }),
      "Bell hook",
    );
    await userEvent.fill(
      page.getByRole("textbox", { name: "Skill" }),
      "Rot hymn",
    );
    await userEvent.fill(
      page.getByRole("textbox", { name: "Value" }).first(),
      "40s",
    );
    await userEvent.fill(
      page.getByLabelText("GM description"),
      "The GM knows it fears bells.",
    );
    await userEvent.fill(
      page.getByLabelText("Player description"),
      "A crown of nails and black milk.",
    );
    await userEvent.click(page.getByRole("button", { name: "Save enemy" }));

    await expect
      .poll(() => enemiesMock.saveEnemy)
      .toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Carrion Saint",
          type: "Corpse saint",
          habitat: "Road shrine",
          description: "The GM knows it fears bells.",
          playerDescription: "A crown of nails and black milk.",
          currentHealth: 8,
          healthPercent: 100,
          maxHealth: 8,
          morale: 7,
          armorDie: "-d2",
          attacks: [expect.objectContaining({ name: "Bell hook", die: "d4" })],
          specials: [expect.objectContaining({ name: "Rot hymn" })],
          loot: expect.arrayContaining([
            expect.objectContaining({ label: "Head", value: "40s" }),
          ]),
        }),
      );
  });
});
