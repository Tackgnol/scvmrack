import { render } from "vitest-browser-react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import BrowserTestProvider from "../BrowserTestProvider";
import { ReportPage } from "@/pages/ReportPage";
import { submitPublicReport } from "@/api/reports";
import { getClassDetail } from "@/api/classes";

const search = vi.hoisted(() => ({ value: {} as { classId?: string } }));
vi.mock("@/seo/Seo", () => ({ Seo: () => null }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
  useSearch: () => search.value,
}));
vi.mock("@/api/reports", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/reports")>()),
  submitPublicReport: vi.fn(),
}));
vi.mock("@/api/classes", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/classes")>()),
  getClassDetail: vi.fn(),
}));

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserTestProvider>
        <ReportPage />
      </BrowserTestProvider>
    </QueryClientProvider>,
  );
}

describe("ReportPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    search.value = {};
    vi.mocked(getClassDetail).mockRejectedValue(new Error("not public"));
    vi.mocked(submitPublicReport).mockResolvedValue({ id: "550e8400-e29b-41d4-a716-446655440000" });
  });

  it("lists what is still needed, then sends a report for a pasted class link", async () => {
    renderPage();

    await expect.element(page.getByText(/Still needed: Class reference, Reason/)).toBeVisible();
    await expect.element(page.getByRole("button", { name: "Submit report" })).toBeDisabled();

    await userEvent.fill(page.getByRole("textbox", { name: "Class reference" }), "https://scvmrack.rpgtools.co/classes/12");
    await userEvent.click(page.getByRole("combobox", { name: "Reason" }));
    await userEvent.click(page.getByRole("option", { name: /Copyright/i }));
    await userEvent.fill(page.getByRole("textbox", { name: "Explain what happened" }), "It copies my zine.");
    await userEvent.fill(page.getByRole("textbox", { name: "Your name" }), "Ada");
    await userEvent.fill(page.getByRole("textbox", { name: "Your email" }), "ada@example.com");
    await userEvent.click(page.getByRole("checkbox"));
    await userEvent.click(page.getByRole("button", { name: "Submit report" }));

    await expect
      .poll(() => vi.mocked(submitPublicReport).mock.calls[0]?.[0])
      .toMatchObject({ classId: 12, reason: "copyright", reporterName: "Ada", reporterEmail: "ada@example.com" });
    await expect.element(page.getByRole("alert")).toBeVisible();
  });

  it("accepts a CSAM report without contact details", async () => {
    search.value = { classId: "7" };
    renderPage();

    await userEvent.click(page.getByRole("combobox", { name: "Reason" }));
    await userEvent.click(page.getByRole("option", { name: /child sexual abuse/i }));
    await userEvent.fill(page.getByRole("textbox", { name: "Explain what happened" }), "Remove this.");
    await userEvent.click(page.getByRole("checkbox"));
    await userEvent.click(page.getByRole("button", { name: "Submit report" }));

    await expect.poll(() => vi.mocked(submitPublicReport).mock.calls[0]?.[0]).toMatchObject({ classId: 7, reporterName: "" });
  });
});
