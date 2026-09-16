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
const characterMock = vi.hoisted(() => ({ characterId: null as string | null }));
const authClientMock = vi.hoisted(() => ({
  issueObrExchangeToken: vi.fn<() => Promise<string>>(() =>
    Promise.resolve("exchange-token"),
  ),
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
  obrAuthClient: authClientMock,
}));

vi.stubGlobal("open", windowOpenMock);

describe("ObrLayout", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    characterMock.characterId = null;
    authClientMock.issueObrExchangeToken.mockResolvedValue("exchange-token");
    windowOpenMock.mockReturnValue({} as Window);
    window.localStorage.removeItem("i18nextLng");
    await i18n.changeLanguage("en");
  });

  afterEach(async () => {
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

    await expect.element(page.getByRole("button", { name: "⊠ Collapse" })).toBeVisible();

    await userEvent.click(page.getByRole("button", { name: "⊠ Collapse" }));

    expect(obrMock.setWidth).toHaveBeenLastCalledWith(420);
    await expect.element(page.getByRole("button", { name: "⤢ Expand" })).toBeVisible();
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

  it("issues an exchange token and opens the full-site bridge (RPG-252)", async () => {
    characterMock.characterId = "character-1";

    await render(
      <BrowserTestProvider>
        <ObrLayout>
          <div>Panel body</div>
        </ObrLayout>
      </BrowserTestProvider>,
    );

    await userEvent.click(page.getByRole("button", { name: "Open in scvmrack" }));

    await expect
      .poll(() => authClientMock.issueObrExchangeToken)
      .toHaveBeenCalledOnce();
    expect(windowOpenMock).toHaveBeenCalledWith(
      "/obr-open?token=exchange-token&character=character-1",
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("shows a retryable error when the browser blocks the new tab", async () => {
    characterMock.characterId = "character-1";
    windowOpenMock.mockReturnValueOnce(null);

    await render(
      <BrowserTestProvider>
        <ObrLayout>
          <div>Panel body</div>
        </ObrLayout>
      </BrowserTestProvider>,
    );

    await userEvent.click(page.getByRole("button", { name: "Open in scvmrack" }));

    await expect
      .poll(() => obrMock.showNotification)
      .toHaveBeenCalledWith("Could not open in scvmrack", "ERROR");
  });
});
