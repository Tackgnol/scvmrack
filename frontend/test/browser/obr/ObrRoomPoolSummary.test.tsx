import { render } from "vitest-browser-react";
import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import BrowserTestProvider from "../BrowserTestProvider";
import { ObrRoomPoolSummary } from "@/components/obr/ObrRoomPoolSummary/ObrRoomPoolSummary";
import { fetchClasses } from "@/api/draft";
import i18n, { loadLanguage } from '@/i18n';

vi.mock("@/api/draft", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/draft")>()),
  fetchClasses: vi.fn(),
}));

describe("ObrRoomPoolSummary", () => {
  it("lists the room party's classes read-only for someone who doesn't own it", async () => {
    vi.mocked(fetchClasses).mockResolvedValue({
      classes: [
        { id: 1, name: "Fanged Deserter", description: null },
        { id: 2, name: "Gutterborn Scum", description: null },
      ],
      classlessEnabled: true,
    });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <BrowserTestProvider>
          <ObrRoomPoolSummary roomId="room-1" />
        </BrowserTestProvider>
      </QueryClientProvider>,
    );

    await expect
      .element(page.getByText("Classes this room rolls: Fanged Deserter, Gutterborn Scum, Classless. Only the party's owner can change them."))
      .toBeVisible();
    await expect.poll(() => vi.mocked(fetchClasses).mock.calls[0]?.[3]).toBe("room-1");
  });

  it.each([
    { locale: 'en', named: true, classlessEnabled: false, text: 'Classes this room rolls: Ash Cartographer.' },
    { locale: 'en', named: true, classlessEnabled: true, text: 'Classes this room rolls: Ash Cartographer, Classless.' },
    { locale: 'en', named: false, classlessEnabled: true, text: 'Classes this room rolls: Classless only.' },
    { locale: 'en', named: false, classlessEnabled: false, text: 'No scvm can be rolled in this room.' },
    { locale: 'pl', named: true, classlessEnabled: false, text: 'Klasy losowane w tym pokoju: Ash Cartographer.' },
    { locale: 'pl', named: true, classlessEnabled: true, text: 'Klasy losowane w tym pokoju: Ash Cartographer, Bez klasy.' },
    { locale: 'pl', named: false, classlessEnabled: true, text: 'Klasy losowane w tym pokoju: Tylko bez klasy.' },
    { locale: 'pl', named: false, classlessEnabled: false, text: 'W tym pokoju nie można wylosować scvma.' },
  ])('describes $locale named=$named classless=$classlessEnabled honestly', async ({ locale, named, classlessEnabled, text }) => {
    await loadLanguage(locale);
    await i18n.changeLanguage(locale);
    vi.mocked(fetchClasses).mockResolvedValue({
      classes: named ? [{ id: 17, name: 'Ash Cartographer', description: null }] : [],
      classlessEnabled,
    });
    render(<BrowserTestProvider><QueryClientProvider client={new QueryClient()}>
      <ObrRoomPoolSummary roomId="room-1" />
    </QueryClientProvider></BrowserTestProvider>);
    await expect.element(page.getByText(text, { exact: false })).toBeVisible();
  });
});
