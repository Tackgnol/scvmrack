import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { beforeEach, describe, expect, it } from "vitest";
import BrowserTestProvider from "./BrowserTestProvider";
import {
  ObrPartyRoster,
  type ObrPartyRosterCard,
} from "@/components/obr/ObrPartyRoster";
import i18n from "@/i18n";

const sampleCard: ObrPartyRosterCard = {
  id: "f15c7ec3-dad2-4f65-8b69-0f1f642c7d29",
  name: "Karg",
  className: "Hermetyczny pustelnik",
  currentHp: 2,
  maxHp: 3,
  agility: 8,
  presence: 11,
  strength: 13,
  toughness: 16,
  drToDodge: 14,
  drToMelee: 10,
  drToRanged: 11,
  omens: 1,
  maxOmens: 2,
  silver: 10,
  equippedWeapons: [{ name: "Kostur", dice: [4] }],
  equippedArmor: { name: "Leather armor", dice: [2] },
  computedModifiers: [
    {
      originName: "Heavy armor",
      statistic: "agility",
      source: "Heavy armor penalty",
      value: -1,
    },
    {
      originName: "Shield",
      statistic: "agility",
      source: "Shield bonus",
      value: 1,
    },
  ],
  bodyDescription: "gaunt",
  trait1: "grim",
  trait2: "patient",
};

describe("ObrPartyRoster", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("renders the GM roster header and compact card rows", async () => {
    await render(
      <BrowserTestProvider>
        <ObrPartyRoster cards={[sampleCard]} maxMembers={8} />
      </BrowserTestProvider>,
    );

    await expect
      .element(page.getByText("GM · OVERVIEW 1/8"))
      .toBeVisible();
    await expect.element(page.getByText("Karg")).toBeVisible();
    await expect.element(page.getByText("Hermetyczny pustelnik")).toBeVisible();
    await expect
      .element(page.getByRole("progressbar"))
      .toBeVisible();
    await expect.element(page.getByText("2/3")).toBeVisible();
    await expect.element(page.getByText("DOD")).toBeVisible();
    await expect.element(page.getByText("MEL")).toBeVisible();
    await expect.element(page.getByText("RNG")).toBeVisible();
    await expect.element(page.getByText("DR")).toBeVisible();
  });

  it("expands computed modifiers from the Mods control", async () => {
    await render(
      <BrowserTestProvider>
        <ObrPartyRoster cards={[sampleCard]} />
      </BrowserTestProvider>,
    );

    const modyButton = page.getByRole("button", { name: /toggle karg detail/i });
    await expect.element(modyButton).toBeVisible();
    await userEvent.click(modyButton);

    await expect.element(page.getByText("Heavy armor")).toBeVisible();
    await expect.element(page.getByText("−1 AGILITY")).toBeVisible();
    await expect.element(page.getByText("Shield")).toBeVisible();
    await expect.element(page.getByText("+1 AGILITY")).toBeVisible();
    await expect.element(page.getByText("Leather armor (−d2)")).toBeVisible();
  });

  it("renders an empty roster state while scene wiring is absent", async () => {
    await render(
      <BrowserTestProvider>
        <ObrPartyRoster cards={[]} maxMembers={8} />
      </BrowserTestProvider>,
    );

    await expect
      .element(page.getByText("GM · OVERVIEW 0/8"))
      .toBeVisible();
    await expect
      .element(page.getByText("No bound scvm yet. Players must bind a scvm to a token."))
      .toBeVisible();
  });
});
