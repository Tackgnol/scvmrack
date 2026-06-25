import { render } from "vitest-browser-react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { PartySheetPill } from "@/components/organisms/party/PartySheetPill";
import { usePartyDetail } from "@/hooks/usePartyRepository";
import { usePartyStream } from "@/hooks/usePartyStream";
import BrowserTestProvider from "../../BrowserTestProvider";

vi.mock("@/hooks/usePartyRepository", () => ({ usePartyDetail: vi.fn() }));
vi.mock("@/hooks/usePartyStream", () => ({ usePartyStream: vi.fn() }));
vi.mock("@/components/organisms/party/WarbandTarotDeck", () => ({
  WarbandTarotDeck: ({
    members,
  }: {
    members: Array<{ id: string; name: string }>;
  }) => (
    <div data-testid="warband-tarot-deck">
      {members.map((member) => (
        <span key={member.id}>{member.name}</span>
      ))}
    </div>
  ),
}));

const mockedDetail = vi.mocked(usePartyDetail);
const mockedStream = vi.mocked(usePartyStream);

describe("PartySheetPill", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedDetail.mockReturnValue({
      data: {
        id: "party-1",
        name: "Test",
        memberCount: 2,
        members: [
          { characterId: "azor", name: "Azor" },
          { characterId: "urvarq", name: "Urvarq" },
        ],
      },
    } as never);
    mockedStream.mockReturnValue({
      changedFieldsByCharacter: {},
      presenceByCharacter: {},
      clearChangedFields: vi.fn(),
    } as never);
  });

  it("opens a read-only tarot-deck drawer without scvm navigation buttons", async () => {
    await render(
      <BrowserTestProvider>
        <PartySheetPill partyId="party-1" characterId="azor" />
      </BrowserTestProvider>,
    );

    await userEvent.click(page.getByTestId("party-sheet-pill"));

    await expect.element(page.getByTestId("party-roster-drawer")).toBeVisible();
    await expect.element(page.getByTestId("warband-tarot-deck")).toBeVisible();
    await expect.element(page.getByText("Azor")).toBeVisible();
    await expect.element(page.getByText("Urvarq")).toBeVisible();

    const buttonLabels = Array.from(document.querySelectorAll("button")).map(
      (button) => button.textContent?.trim(),
    );
    expect(buttonLabels).not.toContain("Azor");
    expect(buttonLabels).not.toContain("Urvarq");
  });
});
