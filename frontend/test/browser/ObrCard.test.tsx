import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { beforeEach, describe, expect, it } from "vitest";
import BrowserTestProvider from "./BrowserTestProvider";
import { ObrCard, type ObrCardCharacter } from "@/components/obr/ObrCard";
import i18n from "@/i18n";

const sampleCard: ObrCardCharacter = {
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
  ],
  bodyDescription: "gaunt",
  trait1: "grim",
  trait2: "patient",
};

describe("ObrCard", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("renders a compact table-visible character card", async () => {
    await render(
      <BrowserTestProvider>
        <ObrCard card={sampleCard} />
      </BrowserTestProvider>,
    );

    await expect.element(page.getByTestId("warband-card")).toBeVisible();
    await expect.element(page.getByText("Karg")).toBeVisible();
    await expect.element(page.getByText("Hermetyczny pustelnik")).toBeVisible();
    await expect
      .element(page.getByRole("progressbar", { name: "Hit points" }))
      .toBeVisible();
    await expect.element(page.getByText("2/3")).toBeVisible();
    await expect.element(page.getByText("1/2")).toBeVisible();
    await expect.element(page.getByText("Kostur (d4)")).toBeVisible();
    await expect.element(page.getByText("Leather armor (−d2)")).toBeVisible();
    await expect.element(page.getByText("Heavy armor")).toBeVisible();
    await expect.element(page.getByText("−1 AGILITY")).toBeVisible();
  });

  it("renders a compact status state when the bound card is stale", async () => {
    await render(
      <BrowserTestProvider>
        <ObrCard card={null} error="NIE ZNALEZIONO SCVM" />
      </BrowserTestProvider>,
    );

    await expect.element(page.getByRole("status")).toBeVisible();
    await expect.element(page.getByText("NIE ZNALEZIONO SCVM")).toBeVisible();
  });
});
