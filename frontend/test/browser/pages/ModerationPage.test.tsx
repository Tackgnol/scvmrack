import { render } from "vitest-browser-react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import BrowserTestProvider from "../BrowserTestProvider";
import { ModerationPage } from "@/pages/ModerationPage";
import { listOpenModerationReports } from "@/api/moderation";

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
        latest: { id: 12, lineageId: "lineage-1", name: "Bog Witch", version: 2 },
        versions: [
          { id: 12, lineageId: "lineage-1", name: "Bog Witch", version: 2 },
          { id: 9, lineageId: "lineage-1", name: "Bog Witch", version: 1 },
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
  });
});