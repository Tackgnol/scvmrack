import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n, { loadLanguage } from '@/i18n';
import { fetchClasses } from "@/api/draft";
import { ObrRollPicker } from "@/components/obr/ObrRollPicker/ObrRollPicker";
import type { ObrRollPickerProps } from "@/components/obr/ObrRollPicker/ObrRollPicker.models";
import BrowserTestProvider from "../BrowserTestProvider";

vi.mock("@/api/draft", async (original) => ({
  ...(await original<typeof import("@/api/draft")>()),
  fetchClasses: vi.fn(),
}));

function picker(props: Partial<ObrRollPickerProps> = {}, client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 300_000 } } })) {
  return (
    <BrowserTestProvider>
      <QueryClientProvider client={client}>
        <ObrRollPicker open roomId="room-qa" locale="en" onClose={vi.fn()} onChoose={vi.fn()} {...props} />
      </QueryClientProvider>
    </BrowserTestProvider>
  );
}

describe("Owlbear room class selection", () => {
  afterEach(async () => {
    document.body.style.colorScheme = '';
    await page.viewport(1280, 720);
  });
  beforeEach(() => {
    vi.mocked(fetchClasses).mockReset();
    vi.mocked(fetchClasses).mockResolvedValue({
      classes: [{ id: 17, name: "Ash Cartographer", description: "Carries the Cinder Map." }],
      classlessEnabled: false,
    });
  });

  it("chooses the enabled custom class in this room without offering Classless", async () => {
    const chosen = vi.fn();
    render(picker({ onChoose: chosen }));
    await expect.element(page.getByRole("button", { name: "Ash Cartographer Carries the Cinder Map." })).toBeVisible();
    await expect.element(page.getByRole("button", { name: "Classless Scvm", exact: true })).not.toBeInTheDocument();
    await userEvent.click(page.getByRole("button", { name: "Ash Cartographer Carries the Cinder Map." }));
    await expect.poll(() => chosen).toHaveBeenCalledWith(17);
    expect(fetchClasses).toHaveBeenCalledWith("en", expect.any(AbortSignal), undefined, "room-qa");
  });

  it("offers an explicit Classless roll when the room permits it", async () => {
    vi.mocked(fetchClasses).mockResolvedValue({ classes: [], classlessEnabled: true });
    const chosen = vi.fn();
    render(picker({ onChoose: chosen }));
    await userEvent.click(page.getByRole("button", { name: "Classless Scvm", exact: true }));
    await expect.poll(() => chosen).toHaveBeenCalledWith(null, true);
  });

  it.each(['en', 'pl'].flatMap(locale => ['light', 'dark'].map(scheme => ({ locale, scheme }))))
  ('fits the class picker in compact $locale / $scheme', async ({ locale, scheme }) => {
    await page.viewport(420, 600);
    document.body.style.colorScheme = scheme;
    await loadLanguage(locale);
    await i18n.changeLanguage(locale);
    render(picker({ locale }));
    await expect.element(page.getByRole('button', { name: 'Ash Cartographer Carries the Cinder Map.' })).toBeVisible();
    await expect.element(page.getByRole('button', { name: i18n.t('create.randomClass'), exact: true })).toBeVisible();
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  });

  it("keeps Random distinct from an explicit Classless roll", async () => {
    const chosen = vi.fn();
    render(picker({ onChoose: chosen }));
    await userEvent.click(page.getByRole("button", { name: "Random", exact: true }));
    await expect.poll(() => chosen).toHaveBeenCalledWith(null);
  });

  it("lets the player retry a failed pool read before selecting a class", async () => {
    vi.mocked(fetchClasses).mockRejectedValueOnce(new Error("offline"));
    const chosen = vi.fn();
    render(picker({ onChoose: chosen }));
    await expect.element(page.getByRole("alert")).toHaveTextContent("Could not load room classes.");
    expect(chosen).not.toHaveBeenCalled();
    await userEvent.click(page.getByRole("button", { name: "Retry", exact: true }));
    await userEvent.click(page.getByRole("button", { name: "Ash Cartographer Carries the Cinder Map." }));
    await expect.poll(() => chosen).toHaveBeenCalledWith(17);
  });

  it("refreshes the pool when reopened after the GM changes it", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 300_000 } } });
    const view = await render(picker({}, client));
    await expect.element(page.getByRole("button", { name: "Ash Cartographer Carries the Cinder Map." })).toBeVisible();
    await view.rerender(picker({ open: false }, client));
    vi.mocked(fetchClasses).mockResolvedValue({ classes: [], classlessEnabled: true });
    await view.rerender(picker({}, client));
    await expect.element(page.getByRole("button", { name: "Classless Scvm", exact: true })).toBeVisible();
    await expect.element(page.getByRole("button", { name: "Ash Cartographer Carries the Cinder Map." })).not.toBeInTheDocument();
  });

  it("does not read room classes until the player opens Roll", async () => {
    render(picker({ open: false }));
    expect(fetchClasses).not.toHaveBeenCalled();
    await expect.element(page.getByRole("button", { name: "Random", exact: true })).not.toBeInTheDocument();
  });
});
