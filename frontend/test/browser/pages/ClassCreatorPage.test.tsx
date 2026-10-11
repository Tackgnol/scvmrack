import { render } from "vitest-browser-react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import BrowserTestProvider from "../BrowserTestProvider";
import { ClassCreatorPage } from "@/pages/ClassCreatorPage";
import { getMyCreationBan } from "@/api/classes";
import { useAuth } from "@/hooks/useAuth";
import { useParams } from "@tanstack/react-router";

vi.mock("@/seo/Seo", () => ({ Seo: () => null }));
vi.mock("@/api/classes", () => ({
  classKeys: { draft: (id: number) => ["draft", id], creationBan: () => ["creation-ban"] },
  getClassDraft: vi.fn(),
  getMyCreationBan: vi.fn(),
}));
vi.mock("@/hooks/useAuth", () => ({ useAuth: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({ useParams: vi.fn() }));
vi.mock("@/components/organisms/class-creator/ClassCreator/ClassCreator", () => ({ ClassCreator: () => <div>New class editor</div> }));
vi.mock("@/components/organisms/class-creator/SavedClassCreator/SavedClassCreator", () => ({ SavedClassCreator: () => <div>Existing class editor</div> }));

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserTestProvider><ClassCreatorPage /></BrowserTestProvider>
    </QueryClientProvider>,
  );
}

describe("ClassCreatorPage creation bans", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true, isLoading: false } as never);
  });

  it("explains a ban and does not open a new-class editor", async () => {
    vi.mocked(useParams).mockReturnValue({} as never);
    vi.mocked(getMyCreationBan).mockResolvedValue({ banned: true });

    await renderPage();

    await expect.element(page.getByText("You cannot create new Custom Classes while a moderation restriction is active. Your existing classes remain available.")).toBeVisible();
    await expect.element(page.getByText("New class editor")).not.toBeInTheDocument();
  });

  it("keeps an existing class editable even when the GM is banned", async () => {
    vi.mocked(useParams).mockReturnValue({ classId: "7" } as never);
    vi.mocked(getMyCreationBan).mockResolvedValue({ banned: true });

    await renderPage();

    await expect.element(page.getByText("Existing class editor")).toBeVisible();
    expect(vi.mocked(getMyCreationBan)).not.toHaveBeenCalled();
  });
});
