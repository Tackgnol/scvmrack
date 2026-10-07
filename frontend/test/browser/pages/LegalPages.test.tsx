import { render } from "vitest-browser-react";
import { expect, describe, it } from "vitest";
import { page } from "vitest/browser";
import i18n from "@/i18n";
import { LegalPage } from "@/pages/LegalPage";
import { TermsPage } from "@/pages/TermsPage";
import BrowserTestProvider from "../BrowserTestProvider";

describe("legal pages", () => {
  it("shows the English terms requirements", async () => {
    await i18n.changeLanguage("en");
    await render(
      <BrowserTestProvider>
        <TermsPage />
      </BrowserTestProvider>,
    );
    await expect
      .element(page.getByRole("heading", { name: "Terms of Service" }))
      .toBeVisible();
    await expect
      .element(page.getByText("Last updated: 7 October 2026"))
      .toBeVisible();
    await expect
      .element(page.getByRole("heading", { name: "Your content and licence" }))
      .toBeVisible();
    await expect
      .element(
        page.getByRole("heading", { name: "Moderation, reports, and appeals" }),
      )
      .toBeVisible();
    await expect
      .element(page.getByRole("heading", { name: "Custom Class limits" }))
      .toBeVisible();
  });

  it("shows the Polish regulation", async () => {
    await i18n.changeLanguage("pl");
    await render(
      <BrowserTestProvider>
        <TermsPage />
      </BrowserTestProvider>,
    );
    await expect
      .element(page.getByRole("heading", { name: "Regulamin usługi" }))
      .toBeVisible();
  });

  it("shows Polish contact details and appeals address", async () => {
    await i18n.changeLanguage("pl");
    await render(
      <BrowserTestProvider>
        <LegalPage />
      </BrowserTestProvider>,
    );
    await expect
      .element(page.getByRole("link", { name: "contact@rpgtools.co" }).first())
      .toBeVisible();
    await expect
      .element(page.getByText("scvmrack-appeal@rpgtools.co"))
      .toBeVisible();
    await expect.element(page.getByText(/Adama Kościelniaka/)).toBeVisible();
  });
});
