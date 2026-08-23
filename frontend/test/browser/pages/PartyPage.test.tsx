import { render } from "vitest-browser-react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import BrowserTestProvider from "../BrowserTestProvider";
import { PartyPage } from "@/pages/PartyPage";
import {
  usePartyDetail,
  useKickPartyMember,
  useRegeneratePartyLink,
  useRenameParty,
  useSetPartyMiseries,
} from "@/hooks/usePartyRepository";
import { usePartyStream } from "@/hooks/usePartyStream";
import { appHistory } from "@/router/history";
import { isApiNotFound } from "@/utils/errorUtils";

vi.mock("@/seo/Seo", () => ({ Seo: () => null }));
vi.mock("@/pages/NotFoundPage", () => ({
  NotFoundPage: () => <div data-testid="not-found">Not found</div>,
}));
vi.mock("@/router/history", () => ({
  appHistory: {
    subscribe: vi.fn(() => () => {}),
    location: { pathname: "/party/p1" },
    push: vi.fn().mockResolvedValue({ type: "PUSHED" }),
    replace: vi.fn().mockResolvedValue({ type: "PUSHED" }),
    flush: vi.fn(),
  },
}));
vi.mock("@/router/navigation", () => ({
  buildPartyCharacterPath: (partyId: string, characterId: string) =>
    `/party/${partyId}/character/${characterId}`,
}));
vi.mock("@/utils/errorUtils", () => ({
  isApiNotFound: vi.fn(() => false),
  getUserFacingApiErrorMessage: vi.fn(() => "error message"),
}));
vi.mock("@/hooks/usePartyStream", () => ({ usePartyStream: vi.fn() }));
vi.mock("@/components/organisms/party/WarbandVitalStrip", () => ({
  WarbandVitalStrip: ({
    members,
    renderActions,
  }: {
    members: Array<{ id: string; name: string; disconnected?: boolean }>;
    renderActions?: (member: { id: string; name: string }) => React.ReactNode;
  }) => (
    <div data-testid="vital-strip">
      {members.map((member) => (
        <div key={member.id}>
          <span>{member.name}</span>
          {member.disconnected && <span>Disconnected</span>}
          {renderActions?.(member)}
        </div>
      ))}
    </div>
  ),
}));
vi.mock("@/hooks/usePartyRepository", () => ({
  usePartyDetail: vi.fn(),
  useKickPartyMember: vi.fn(),
  useRegeneratePartyLink: vi.fn(),
  useRenameParty: vi.fn(),
  useSetPartyMiseries: vi.fn(),
}));

const mockedDetail = vi.mocked(usePartyDetail);
const mockedKick = vi.mocked(useKickPartyMember);
const mockedRegen = vi.mocked(useRegeneratePartyLink);
const mockedRename = vi.mocked(useRenameParty);
const mockedSetMiseries = vi.mocked(useSetPartyMiseries);
const mockedStream = vi.mocked(usePartyStream);
const mockedNotFound = vi.mocked(isApiNotFound);

function gmParty() {
  return {
    id: "p1",
    name: "The Doomed",
    role: "gm" as const,
    inviteToken: "tok",
    invitePath: "/join/tok",
    memberCount: 1,
    maxMembers: 10,
    members: [
      {
        characterId: "c1",
        name: "Vrax",
        classId: 1,
        currentHp: 5,
        maxHp: 8,
        owned: false,
        joinedAt: null,
      },
    ],
  };
}

function detail(over: Record<string, unknown> = {}) {
  mockedDetail.mockReturnValue({
    data: undefined,
    isLoading: false,
    error: null,
    ...over,
  } as never);
}

const renderPage = () =>
  render(
    <BrowserTestProvider>
      <PartyPage />
    </BrowserTestProvider>,
  );

describe("PartyPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedNotFound.mockReturnValue(false);
    mockedStream.mockReturnValue({
      status: "idle",
      changedFieldsByCharacter: {},
      presenceByCharacter: {},
      clearChangedFields: vi.fn(),
    } as never);
    mockedKick.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      error: null,
    } as never);
    mockedRegen.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      error: null,
    } as never);
    mockedRename.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      error: null,
    } as never);
    mockedSetMiseries.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
      data: undefined,
    } as never);
    detail({ data: gmParty() });
  });
  afterEach(() => vi.clearAllMocks());

  it("renders the GM manage view with invite link and members", async () => {
    await renderPage();
    await expect.element(page.getByText("/join/tok")).toBeVisible();
    await expect
      .element(page.getByText(/game master · overview/i))
      .toBeVisible();
    await expect.element(page.getByTestId("vital-strip")).toBeVisible();
    await expect.element(page.getByText("Vrax")).toBeVisible();
    await expect
      .element(page.getByRole("button", { name: /kick/i }))
      .toBeVisible();
  });

  it("regenerates the invite link", async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ inviteToken: "new" });
    mockedRegen.mockReturnValue({
      mutateAsync,
      isPending: false,
      error: null,
    } as never);
    await renderPage();
    await userEvent.click(
      page.getByRole("button", { name: /generate new link/i }),
    );
    await vi.waitFor(() => expect(mutateAsync).toHaveBeenCalled());
  });

  it("collapses and reopens the invite link panel", async () => {
    await renderPage();

    await expect.element(page.getByText("/join/tok")).toBeVisible();

    await userEvent.click(page.getByRole("button", { name: /hide link/i }));
    await vi.waitFor(() =>
      expect(document.body.textContent).not.toContain("/join/tok"),
    );

    await userEvent.click(page.getByRole("button", { name: /show link/i }));
    await expect.element(page.getByText("/join/tok")).toBeVisible();
  });

  it("marks a member as disconnected from stream presence", async () => {
    mockedStream.mockReturnValue({
      status: "open",
      changedFieldsByCharacter: {},
      presenceByCharacter: { c1: false },
      clearChangedFields: vi.fn(),
    } as never);

    await renderPage();

    await expect.element(page.getByText("Disconnected")).toBeVisible();
  });

  it("kicks a member", async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    mockedKick.mockReturnValue({
      mutateAsync,
      isPending: false,
      error: null,
    } as never);
    await renderPage();
    await userEvent.click(page.getByRole("button", { name: /kick/i }));
    await vi.waitFor(() => expect(mutateAsync).toHaveBeenCalledWith("c1"));
  });

  it("sets the selected Misery count for every party member", async () => {
    const mutate = vi.fn();
    mockedSetMiseries.mockReturnValue({
      mutate,
      isPending: false,
      error: null,
      data: undefined,
    } as never);
    await renderPage();

    const control = page.getByTestId("gm-misery-control");
    await userEvent.click(control.getByRole("button", { name: /misery iv/i }));
    await userEvent.click(
      control.getByRole("button", { name: /set 4 \/ 7 for all scvms/i }),
    );

    await expect.poll(() => mutate).toHaveBeenCalledWith(4);
  });

  it("redirects a member to their own party-character URL", async () => {
    detail({
      data: {
        ...gmParty(),
        role: "member",
        members: [
          {
            characterId: "mine",
            name: "Mine",
            classId: null,
            currentHp: 3,
            maxHp: 6,
            owned: true,
            joinedAt: null,
          },
        ],
      },
    });
    await renderPage();
    await vi.waitFor(() =>
      expect(vi.mocked(appHistory.replace)).toHaveBeenCalledWith(
        "/party/p1/character/mine",
      ),
    );
  });

  it('shows the guild mock: a "what are guilds" link and a coming-soon notice', async () => {
    await renderPage();

    const guildLink = page.getByRole("link", { name: /what are guilds/i });
    await expect.element(guildLink).toBeVisible();
    await expect
      .element(guildLink)
      .toHaveAttribute("href", "https://rpgtools.co/guilds");

    await userEvent.click(
      page.getByRole("button", { name: /invite guild members/i }),
    );
    await expect.element(page.getByText(/coming soon/i)).toBeVisible();
  });

  it("renames the warband inline", async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ name: "The Damned" });
    mockedRename.mockReturnValue({
      mutateAsync,
      isPending: false,
      error: null,
    } as never);
    await renderPage();

    await userEvent.click(page.getByRole("button", { name: /rename/i }));
    const input = page.getByRole("textbox", { name: /warband name/i });
    await expect.element(input).toBeVisible();
    await userEvent.fill(input, "The Damned");
    await userEvent.keyboard("{Enter}");

    await vi.waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith("The Damned"),
    );
  });

  it("renders NotFound on a 404", async () => {
    mockedNotFound.mockReturnValue(true);
    detail({ data: undefined, error: new Error("nope") });
    await renderPage();
    await expect.element(page.getByTestId("not-found")).toBeVisible();
  });
});
