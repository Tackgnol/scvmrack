import { render } from "vitest-browser-react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import BrowserTestProvider from "../BrowserTestProvider";
import { ClassesPage } from "@/pages/ClassesPage";
import { deleteClassDraft, listClassDrafts, listMyClasses, publishClass, removeClass } from "@/api/classes";
import { blankDraft } from "@/components/organisms/class-creator/classCreator.utils";
import { useAuth } from "@/hooks/useAuth";

type MockLinkProps = {
  children: ReactNode;
  to: string;
} & AnchorHTMLAttributes<HTMLAnchorElement>;

vi.mock("@/seo/Seo", () => ({ Seo: () => null }));
vi.mock("@/components", () => ({
  MorkBorgModal: ({
    open,
    title,
    children,
    actions,
  }: {
    open: boolean;
    title: string;
    children: ReactNode;
    actions: ReactNode;
  }) =>
    open ? (
      <section aria-label={title}>
        <h2>{title}</h2>
        {children}
        {actions}
      </section>
    ) : null,
  ModalButton: ({
    children,
    ...props
  }: ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: MockLinkProps) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@/hooks/useAuth", () => ({ useAuth: vi.fn() }));
vi.mock("@/api/classes", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/classes")>()),
  listMyClasses: vi.fn(),
  listClassDrafts: vi.fn(),
  deleteClassDraft: vi.fn(),
  publishClass: vi.fn(),
  removeClass: vi.fn(),
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserTestProvider>
        <ClassesPage />
      </BrowserTestProvider>
    </QueryClientProvider>,
  );
}

describe("ClassesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listClassDrafts).mockResolvedValue([]);
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isGuest: false,
      isLoading: false,
    } as ReturnType<typeof useAuth>);
  });

  it("lists the GM classes as the server orders them, each private one with Edit", async () => {
    vi.mocked(listMyClasses).mockResolvedValue([
      {
        id: 9,
        lineageId: "b",
        name: "Bog Witch",
        description: "The mire keeps.",
        languages: ["en"],
        visibility: "private",
        status: "active",
        originCount: 1,
        takenDownAt: null,
        takedownReason: null,
      },
      {
        id: 4,
        lineageId: "a",
        name: "Chain Monk",
        description: null,
        languages: ["en", "pl"],
        visibility: "private",
        status: "active",
        originCount: 3,
        takenDownAt: null,
        takedownReason: null,
      },
    ]);
    renderPage();

    await expect
      .element(page.getByTestId("own-class").first())
      .toHaveTextContent("Bog Witch");
    await expect
      .element(page.getByText("English · Private · 1 origin"))
      .toBeVisible();
    await expect
      .element(page.getByRole("link", { name: "Edit Bog Witch" }))
      .toHaveAttribute("href", "/gm/classes/9");
    await expect
      .element(page.getByRole("link", { name: "Forge a class" }))
      .toHaveAttribute("href", "/gm/classes/new");
  });

  it("requires sharing acknowledgement before publishing a private class", async () => {
    vi.mocked(listMyClasses).mockResolvedValue([
      {
        id: 9,
        lineageId: "b",
        name: "Bog Witch",
        description: null,
        languages: ["en"],
        visibility: "private",
        status: "active",
        originCount: 1,
        takenDownAt: null,
        takedownReason: null,
      },
    ]);
    vi.mocked(publishClass).mockResolvedValue({ visibility: "public" });
    renderPage();

    await userEvent.click(page.getByRole("button", { name: "Publish" }));
    await expect.element(page.getByText("Publish this class?")).toBeVisible();
    const termsLink = page.getByRole('link', { name: 'Terms' });
    await expect.element(termsLink).toBeVisible();
    await expect.element(termsLink).toHaveAttribute('hash', 'publishing');
    await expect
      .element(page.getByRole("button", { name: "Publish" }).last())
      .toBeDisabled();
    await userEvent.click(page.getByRole("checkbox"));
    await userEvent.click(page.getByRole("button", { name: "Publish" }).last());

    await expect.poll(() => vi.mocked(publishClass).mock.calls[0]?.[0]).toBe(9);
  });
  it("confirms draft discard and class removal with their different consequences", async () => {
    vi.mocked(listClassDrafts).mockResolvedValue([{ id: 3, classId: null, draft: { ...blankDraft(), name: { en: "Unfinished", pl: "" } }, revision: 1, updatedAt: "2026-10-12T00:00:00.000Z" }]);
    vi.mocked(listMyClasses).mockResolvedValue([{ id: 9, lineageId: "b", name: "Bog Witch", description: null, languages: ["en"], visibility: "private", status: "active", originCount: 1, takenDownAt: null, takedownReason: null }]);
    vi.mocked(deleteClassDraft).mockResolvedValue();
    vi.mocked(removeClass).mockResolvedValue({ archived: false });
    renderPage();

    await expect.element(page.getByTestId("class-draft")).toBeVisible();
    await expect.element(page.getByText(/No classes yet/)).not.toBeInTheDocument();
    await userEvent.click(page.getByTestId("class-draft").getByRole("button", { name: "Discard" }));
    await expect.element(page.getByText("“Unfinished” will be permanently deleted.")).toBeVisible();
    expect(deleteClassDraft).not.toHaveBeenCalled();
    await userEvent.click(page.getByRole("button", { name: "Cancel" }));
    expect(deleteClassDraft).not.toHaveBeenCalled();
    await userEvent.click(page.getByTestId("class-draft").getByRole("button", { name: "Discard" }));
    await userEvent.click(page.getByRole("alertdialog").getByRole("button", { name: "Discard" }));
    await expect.poll(() => vi.mocked(deleteClassDraft).mock.calls[0]?.[0]).toBe(3);

    await userEvent.click(page.getByTestId("own-class").getByRole("button", { name: "Remove" }));
    await expect.element(page.getByText(/will be deleted if unused/)).toBeVisible();
    expect(removeClass).not.toHaveBeenCalled();
    await userEvent.click(page.getByRole("alertdialog").getByRole("button", { name: "Remove" }));
    await expect.poll(() => vi.mocked(removeClass).mock.calls[0]?.[0]).toBe(9);
  });

  it("tells guests to log in instead of offering the creator", async () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isGuest: true,
      isLoading: false,
    } as ReturnType<typeof useAuth>);
    renderPage();

    await expect
      .element(page.getByText("You need to be logged in to forge classes."))
      .toBeVisible();
    await expect
      .element(page.getByRole("link", { name: "Forge a class" }))
      .not.toBeInTheDocument();
    expect(listMyClasses).not.toHaveBeenCalled();
  });
  it("shows a moderation decision and appeal link to the class owner", async () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isGuest: false,
      isLoading: false,
    } as ReturnType<typeof useAuth>);
    vi.mocked(listMyClasses).mockResolvedValue([
      {
        id: 9,
        lineageId: "b",
        name: "Bog Witch",
        description: null,
        languages: ["en"],
        visibility: "private",
        status: "active",
        originCount: 1,
        takenDownAt: "2026-10-07T12:00:00.000Z",
        takedownReason: "Credible threat",
      },
    ]);
    renderPage();

    await expect
      .element(page.getByText("This class was taken down by moderation."))
      .toBeVisible();
    await expect.element(page.getByText("Credible threat")).toBeVisible();
    await expect.element(page.getByRole("link", { name: "Edit Bog Witch" })).not.toBeInTheDocument();
    await expect.element(page.getByRole("button", { name: "Remove" })).not.toBeInTheDocument();
    await userEvent.click(page.getByRole("button", { name: "Appeal this decision" }));
    await expect.element(page.getByRole("heading", { name: "Dispute this decision" })).toBeVisible();
    await expect
      .element(page.getByRole("link", { name: "Appeal by email" }))
      .toHaveAttribute(
        "href",
        "mailto:scvmrack-appeal@rpgtools.co?subject=Appeal%20class%209",
      );
  });
});
