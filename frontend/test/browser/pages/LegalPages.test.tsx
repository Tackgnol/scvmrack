import { render } from "vitest-browser-react";
import { expect, describe, it } from "vitest";
import { page } from "vitest/browser";
import i18n from "@/i18n";
import { LegalPage } from "@/pages/LegalPage";
import { TermsPage } from "@/pages/TermsPage";
import { PrivacyPage } from "@/pages/PrivacyPage";
import { morkBorgColors } from "@/theme/morkBorgTheme";
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
      .element(page.getByText("Last updated: 9 October 2026"))
      .toBeVisible();
    await expect
      .element(page.getByRole("heading", { name: "Your content and licence" }))
      .toBeVisible();
    await expect
      .element(
        page.getByRole("heading", { name: "Moderation and restrictions" }),
      )
      .toBeVisible();
    await expect
      .element(page.getByRole("heading", { name: "Reporting content" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("heading", { name: "Decisions and appeals" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("heading", { name: "Governing law" }))
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
    await expect
      .element(page.getByText(/Wiążąca jest wersja angielska/))
      .toBeVisible();
    for (const [title, id] of [
      ["Twoje treści i licencja", "publishing"],
      ["Zgłaszanie treści", "reporting"],
      ["Moderacja i ograniczenia", "moderation"],
      ["Decyzje i odwołania", "disputes"],
    ]) {
      const heading = page.getByRole("heading", { name: title });
      await expect.element(heading).toBeVisible();
      await expect.element(heading).toHaveAttribute("id", id);
    }
  });

  it.each([
    {
      language: "en",
      title: "Privacy notice",
      contact: "Controller and contact",
      retention: "Retention",
      children: "Children",
      lastUpdated: "Last updated: 9 October 2026",
    },
    {
      language: "pl",
      title: "Informacja o prywatności",
      contact: "Administrator i kontakt",
      retention: "Okres przechowywania",
      children: "Dzieci",
      lastUpdated: "Ostatnia aktualizacja: 9 października 2026",
    },
  ])(
    "shows the $language privacy notice",
    async ({ language, title, contact, retention, children, lastUpdated }) => {
      await i18n.changeLanguage(language);
      await render(
        <BrowserTestProvider>
          <PrivacyPage />
        </BrowserTestProvider>,
      );
      await expect
        .element(page.getByRole("heading", { name: title, exact: true }))
        .toBeVisible();
      await expect
        .element(page.getByRole("heading", { name: contact }))
        .toBeVisible();
      await expect
        .element(page.getByRole("heading", { name: retention }))
        .toBeVisible();
      await expect
        .element(page.getByRole("heading", { name: children }))
        .toBeVisible();
      await expect.element(page.getByText(lastUpdated)).toBeVisible();
      const contactLink = page.getByRole("link", { name: "contact@rpgtools.co" }).first();
      await expect.element(contactLink).toBeVisible();
      await expect.element(contactLink).toHaveStyle({ color: morkBorgColors.black });
    },
  );

  it("shows Polish contact details and appeals address", async () => {
    await i18n.changeLanguage("pl");
    await render(
      <BrowserTestProvider>
        <LegalPage />
      </BrowserTestProvider>,
    );
    const contactLink = page.getByRole("link", { name: "contact@rpgtools.co" }).first();
    await expect.element(contactLink).toBeVisible();
    await expect.element(contactLink).toHaveStyle({ color: morkBorgColors.black });
    await expect
      .element(page.getByText("scvmrack-appeal@rpgtools.co"))
      .toBeVisible();
    await expect.element(page.getByText(/Adama Kościelniaka/)).toBeVisible();
    await expect.element(page.getByText(/MÖRK BORG Third Party License/)).toBeVisible();
  });
});
