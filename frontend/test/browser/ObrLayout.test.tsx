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
}));

vi.mock("@owlbear-rodeo/sdk", () => ({
  default: {
    onReady: obrMock.onReady,
    action: {
      setWidth: obrMock.setWidth,
    },
  },
}));

describe("ObrLayout", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
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
});
