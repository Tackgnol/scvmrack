import { ObrLayout } from "@/ObrLayout";
import i18n from "@/i18n";
import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BrowserTestProvider from "./BrowserTestProvider";

const obrMock = vi.hoisted(() => ({
  onReady: vi.fn((callback: () => void) => {
    callback();
  }),
  setWidth: vi.fn(),
  setHeight: vi.fn(),
  showNotification: vi.fn<() => Promise<void>>(() => Promise.resolve()),
}));
const characterMock = vi.hoisted(() => ({ characterId: null as string | null,
}));
const authClientMock = vi.hoisted(() => ({
  open: vi.fn<(destination: string) => Promise<void>>(async () => {}),
}));
const windowOpenMock = vi.hoisted(() => vi.fn());

vi.mock("@owlbear-rodeo/sdk", () => ({
  default: {
    onReady: obrMock.onReady,
    action: {
      setWidth: obrMock.setWidth,
      setHeight: obrMock.setHeight,
    },
    notification: {
      show: obrMock.showNotification,
    },
  },
}));

vi.mock("@/CharacterContext/CharacterContext", () => ({
  useCharacter: () => characterMock,
}));

vi.mock("@/auth/obrAuthClient", () => ({
  openObrSessionTab: authClientMock.open,
}));

vi.stubGlobal("open", windowOpenMock);

describe("ObrLayout", () => {
  it.each(['en', 'pl'])("keeps all active-sheet actions inside a 420px panel in %s", async (locale) => {
    await page.viewport(420, 600);
    characterMock.characterId = 'compact-scvm';
    await i18n.changeLanguage(locale);
    await render(
      <BrowserTestProvider>
        <div data-testid="compact-panel" style={{ width: 420 }}>
          <ObrLayout><div>Active sheet</div></ObrLayout>
        </div>
      </BrowserTestProvider>,
    );
    const panel = page.getByTestId('compact-panel').element();
    await document.fonts.ready;
    await expect.element(page.getByText('Active sheet')).toBeVisible();
    await expect.element(page.getByRole('button', { name: locale === 'en' ? 'Open in scvmrack' : 'Otwórz w scvmrack', exact: true,
          }),
        ).toBeVisible();
    const bounds = panel.getBoundingClientRect();
    const wordmarkElement = page.getByText('Scvmrack', { exact: true }).element();
    const wordmark = wordmarkElement.getBoundingClientRect();
    expect(wordmarkElement.scrollWidth).toBeLessThanOrEqual(wordmarkElement.clientWidth,
      );
    const actions = panel.querySelector('button')!.parentElement!.parentElement!.getBoundingClientRect();
    expect(wordmark.right <= actions.left || wordmark.bottom <= actions.top,
      ).toBe(true);
    for (const button of panel.querySelectorAll('button')) {
      const rect = button.getBoundingClientRect();
      expect(rect.left).toBeGreaterThanOrEqual(bounds.left);
      expect(rect.right).toBeLessThanOrEqual(bounds.right);
    }
  },
  );

  beforeEach(async () => {
    vi.clearAllMocks();
    characterMock.characterId = null;
    authClientMock.open.mockResolvedValue(undefined);
    windowOpenMock.mockReturnValue({} as Window);
    window.localStorage.removeItem("i18nextLng");
    await i18n.changeLanguage("en");
  });

  afterEach(async () => {
    await page.viewport(1280, 720);
    await i18n.changeLanguage("en");
  });

  it("lets Owlbear users switch the iframe language", async () => {
    await render(
      <BrowserTestProvider>
        <ObrLayout>
          <div>Panel body</div>
        </ObrLayout>
      </BrowserTestProvider>,
    );

    const english = page.getByTestId("language-en");
    const polish = page.getByTestId("language-pl");

    await expect.element(english).toHaveAttribute("aria-pressed", "true");
    await expect.element(polish).toHaveAttribute("aria-pressed", "false");
    await expect.element(page.getByRole("button", { name: "⤢ Expand" })).toBeVisible();

    await userEvent.click(polish);

    await expect.element(polish).toHaveAttribute("aria-pressed", "true");
    await expect.element(page.getByRole("button", { name: "⤢ Rozszerz" })).toBeVisible();
  });

  it("keeps the Owlbear chrome fixed while the panel body scrolls", async () => {
    await render(
      <BrowserTestProvider>
        <ObrLayout>
          <div style={{ height: 1600 }}>Panel body</div>
        </ObrLayout>
      </BrowserTestProvider>,
    );

    const body = page.getByText("Panel body").element()?.parentElement;
    const container = body?.parentElement;

    expect(body).toBeTruthy();
    expect(container).toBeTruthy();
    expect(getComputedStyle(container!).height).toBe(`${window.innerHeight}px`);
    expect(getComputedStyle(container!).overflow).toBe("hidden");
    expect(getComputedStyle(body!).overflowY).toBe("auto");
  });

  it("maximizes the panel to the host's available screen size, keeping the other mode selectable (RPG-66)", async () => {
    vi.spyOn(window.screen, "availWidth", "get").mockReturnValue(1920);
    vi.spyOn(window.screen, "availHeight", "get").mockReturnValue(1080);

    await render(
      <BrowserTestProvider>
        <ObrLayout>
          <div>Panel body</div>
        </ObrLayout>
      </BrowserTestProvider>,
    );

    await userEvent.click(page.getByRole("button", { name: "⛶ Max" }));

    expect(obrMock.setWidth).toHaveBeenCalledWith(1920);
    expect(obrMock.setHeight).toHaveBeenCalledWith(1080);

    await expect
      .element(page.getByRole("button", { name: "⊠ Collapse" }))
      .toBeVisible();

    await userEvent.click(page.getByRole("button", { name: "⊠ Collapse" }));

    expect(obrMock.setWidth).toHaveBeenLastCalledWith(420);
    await expect
      .element(page.getByRole("button", { name: "⤢ Expand" }))
      .toBeVisible();
  });

  it("hides the open-in-scvmrack action without an active character", async () => {
    await render(
      <BrowserTestProvider>
        <ObrLayout>
          <div>Panel body</div>
        </ObrLayout>
      </BrowserTestProvider>,
    );

    await expect
      .element(page.getByRole("button", { name: "Open in scvmrack" }))
      .not.toBeInTheDocument();
  });

  it("opens the full-site transfer flow (RPG-252)", async () => {
    characterMock.characterId = "character-1";

    await render(
      <BrowserTestProvider>
        <ObrLayout>
          <div>Panel body</div>
        </ObrLayout>
      </BrowserTestProvider>,
    );

    await userEvent.click(
      page.getByRole("button", { name: "Open in scvmrack" }),
    );

    await expect
      .poll(() => authClientMock.open)
      .toHaveBeenCalledWith("/obr-open?character=character-1");
  });

  it("shows a retryable error when the browser blocks the new tab", async () => {
    characterMock.characterId = "character-1";
    authClientMock.open.mockRejectedValueOnce(new Error("popup-blocked"));

    await render(
      <BrowserTestProvider>
        <ObrLayout>
          <div>Panel body</div>
        </ObrLayout>
      </BrowserTestProvider>,
    );

    await userEvent.click(
      page.getByRole("button", { name: "Open in scvmrack" }),
    );

    await expect
      .poll(() => obrMock.showNotification)
      .toHaveBeenCalledWith("Could not open in scvmrack", "ERROR");
  });
});
