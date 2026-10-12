import { render } from "vitest-browser-react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { userEvent } from "vitest/browser";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import BrowserTestProvider from "../BrowserTestProvider";
import { ModerationPage } from "@/pages/ModerationPage";
import { banClassCreation, getCreationBan, listOpenModerationReports, takeDownModerationReport, unbanClassCreation } from "@/api/moderation";

type MockLinkProps = {
  children: ReactNode;
  to: string;
} & AnchorHTMLAttributes<HTMLAnchorElement>;

vi.mock("@/seo/Seo", () => ({ Seo: () => null }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: MockLinkProps) => <a href={to} {...props}>{children}</a>,
}));
vi.mock("@/api/moderation", () => ({
  listOpenModerationReports: vi.fn(),
  getCreationBan: vi.fn(),
  banClassCreation: vi.fn(),
  unbanClassCreation: vi.fn(),
  dismissModerationReport: vi.fn(),
  takeDownModerationReport: vi.fn(),
  removeModerationContent: vi.fn(),
  restoreModerationReport: vi.fn(),
}));

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserTestProvider>
        <ModerationPage />
      </BrowserTestProvider>
    </QueryClientProvider>,
  );
}

describe("ModerationPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("groups reports by class and links the latest and older version previews", async () => {
    vi.mocked(listOpenModerationReports).mockResolvedValue([
      {
        lineageId: "lineage-1",
        ownerUserId: "gm-1",
        latest: { id: 12, lineageId: "lineage-1", name: "Bog Witch", version: 2 },
        versions: [
          { id: 12, lineageId: "lineage-1", name: "Bog Witch", version: 2 },
          { id: 9, lineageId: "lineage-1", name: "Bog Witch", version: 1 },
        ],
        removalHistory: [
          { id: "log-2", className: "Bog Witch", date: "2026-10-09T12:00:00.000Z", reason: "Repeated copying", restored: false },
          { id: "log-1", className: "Bog Witch", date: "2026-10-07T12:00:00.000Z", reason: "Copied text", restored: true },
        ],
        reports: [
          {
            id: "report-1",
            classId: 9,
            className: "Bog Witch",
            lineageId: "lineage-1",
            classVersion: 1,
            reason: "copyright",
            explanation: "The first version copied my work.",
            reporterName: "Reporter",
            reporterEmail: "reporter@example.com",
            createdAt: "2026-10-08T12:00:00.000Z",
            serious: false,
            status: "open",
            disputes: [],
          },
          {
            id: "report-2",
            classId: 12,
            className: "Bog Witch",
            lineageId: "lineage-1",
            classVersion: 2,
            reason: "other",
            explanation: "The latest version needs review too.",
            reporterName: "Another reporter",
            reporterEmail: "another@example.com",
            createdAt: "2026-10-08T13:00:00.000Z",
            serious: false,
            status: "open",
            disputes: [],
          },
        ],
      },
    ]);

    await renderPage();

    await expect.element(page.getByRole("heading", { name: "Bog Witch", level: 2 })).toBeVisible();
    await expect.element(page.getByText("The first version copied my work.")).toBeVisible();
    await expect.element(page.getByText("The latest version needs review too.")).toBeVisible();
    await expect.element(page.getByRole("link", { name: /Preview latest version.*Version 2/ })).toHaveAttribute("href", "/classes/12");
    await expect.element(page.getByRole("link", { name: "Version 1" })).toHaveAttribute("href", "/classes/9");
    await expect.element(page.getByText("GM removal decisions: 2")).toBeVisible();
    await userEvent.click(page.getByText("GM removal decisions: 2"));
    await expect.element(page.getByText("Repeated copying")).toBeVisible();
    await expect.element(page.getByText("Copied text")).toBeVisible();
    await expect.element(page.getByText(/Bog Witch.*Not restored/)).toBeVisible();
    await expect.element(page.getByText(/Bog Witch.*Restored/)).toBeVisible();
  });

  it("stamps serious reports and only takes a class down after confirming", async () => {
    vi.mocked(listOpenModerationReports).mockResolvedValue([
      {
        lineageId: "lineage-1",
        ownerUserId: "gm-1",
        latest: { id: 12, lineageId: "lineage-1", name: "Bog Witch", version: 2 },
        versions: [{ id: 12, lineageId: "lineage-1", name: "Bog Witch", version: 2 }],
        removalHistory: null,
        reports: [
          {
            id: "report-1",
            classId: 12,
            className: "Bog Witch",
            lineageId: "lineage-1",
            classVersion: 2,
            reason: "threat_to_life_or_safety",
            explanation: "A real threat.",
            reporterName: "Witness",
            reporterEmail: "w@example.com",
            createdAt: "2026-10-08T12:00:00.000Z",
            serious: true,
            status: "open",
            disputes: [],
          },
        ],
      },
    ]);
    vi.mocked(takeDownModerationReport).mockResolvedValue(undefined as never);

    await renderPage();
    await expect.element(page.getByText("Needs authority report")).toBeVisible();
    await userEvent.fill(page.getByRole("textbox", { name: "Decision reason" }), "Substantiated");
    await userEvent.click(page.getByRole("button", { name: "Take down" }));

    const dialog = page.getByRole("dialog");
    await expect.element(dialog.getByText(/Bog Witch.*version 2/)).toBeVisible();
    expect(takeDownModerationReport).not.toHaveBeenCalled();
    await userEvent.click(dialog.getByRole("button", { name: "Take down" }));
    await expect.poll(() => vi.mocked(takeDownModerationReport)).toHaveBeenCalledWith("report-1", "Substantiated");
  });

  it("lets an administrator look up a GM and record a creation ban", async () => {
    vi.mocked(listOpenModerationReports).mockResolvedValue([]);
    vi.mocked(getCreationBan).mockResolvedValue({ userId: "gm-1", active: null, history: [] });
    vi.mocked(banClassCreation).mockResolvedValue({ banned: true });

    await renderPage();
    await userEvent.fill(page.getByRole("textbox", { name: "GM user ID" }), "gm-1");
    await userEvent.click(page.getByRole("button", { name: "Look up" }));
    await expect.element(page.getByText("Creation allowed")).toBeVisible();
    await userEvent.fill(page.getByRole("textbox", { name: "Decision reason" }), "Repeated removals");
    await userEvent.click(page.getByRole("button", { name: "Ban class creation" }));
    await expect.poll(() => vi.mocked(banClassCreation)).toHaveBeenCalledWith("gm-1", "Repeated removals");
  });

  it("shows prior ban decisions and allows lifting an active ban", async () => {
    vi.mocked(listOpenModerationReports).mockResolvedValue([]);
    vi.mocked(getCreationBan).mockResolvedValue({
      userId: "gm-1",
      active: { reason: "Repeated removals", bannedAt: "2026-10-10T12:00:00.000Z" },
      history: [{ id: "log-1", action: "class_creation_banned", actorUserId: "admin-1", reason: "Repeated removals", date: "2026-10-10T12:00:00.000Z" }],
    });
    vi.mocked(unbanClassCreation).mockResolvedValue({ banned: false });

    await renderPage();
    await userEvent.fill(page.getByRole("textbox", { name: "GM user ID" }), "gm-1");
    await userEvent.click(page.getByRole("button", { name: "Look up" }));
    await expect.element(page.getByText(/Creation banned.*Repeated removals/)).toBeVisible();
    await expect.element(page.getByText("By admin-1")).toBeVisible();
    await userEvent.fill(page.getByRole("textbox", { name: "Decision reason" }), "Appeal upheld");
    await userEvent.click(page.getByRole("button", { name: "Lift creation ban" }));
    await expect.poll(() => vi.mocked(unbanClassCreation)).toHaveBeenCalledWith("gm-1", "Appeal upheld");
  });
});
