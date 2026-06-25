import { WarbandStripRowView } from "@/components/organisms/party/WarbandStripRowView";
import type { WarbandMember } from "@/components/organisms/party/warbandMember";
import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { beforeEach, describe, expect, it } from "vitest";
import { useState } from "react";
import BrowserTestProvider from "../../BrowserTestProvider";
import i18n, { loadLanguage } from "@/i18n";

const member: WarbandMember = {
  id: "vrax",
  name: "Vrax",
  cls: "Gutterborn Scum",
  dead: false,
  hpText: "11/13",
  hpPct: 85,
  agi: "+1",
  pre: "−2",
  str: "+2",
  tou: "+1",
  dodge: 12,
  melee: 13,
  ranged: 8,
  dr: 2,
  dodgeC: [
    { label: "Base test", labelKey: "gm.baseTest", val: "DR12" },
    { label: "Agility", labelKey: "attributes.agility", val: "+1" },
  ],
  meleeC: [
    { label: "Base test", labelKey: "gm.baseTest", val: "DR12" },
    { label: "Strength", labelKey: "attributes.strength", val: "+2" },
  ],
  rangedC: [
    { label: "Base test", labelKey: "gm.baseTest", val: "DR12" },
    { label: "Presence", labelKey: "attributes.presence", val: "−2" },
  ],
  weapon: "Rusty knife (d4)",
  armor: "Leather armor (−d2)",
  omenText: "2/2",
  silver: 6,
  modifiers: [
    {
      label: "Leather armor",
      value: "−2",
      statKey: "attributes.agility",
      statFallback: "AGILITY",
      effect: "−2 AGILITY",
      kind: "debuff",
      edge: "#FF2FB2",
      descKey: "modifiers.computed.originDescriptions.armor",
      desc: "From equipped armor.",
    },
  ],
  hasMods: true,
  modCount: 1,
  trait1: "Lazy",
  trait2: "Authority-denying",
  habit: "Collects small sharp stones.",
  bodyDesc: "Recently slashed.",
  origin: "A burnt-black building in Sarkash.",
  equipment: [{ name: "Rope", desc: "Frayed but useful." }],
  equipCount: 1,
};

function StripHarness() {
  const [open, setOpen] = useState(false);

  return (
    <WarbandStripRowView
      member={member}
      open={open}
      onToggle={() => setOpen((value) => !value)}
      actions={<button type="button">Kick</button>}
    />
  );
}

describe("WarbandStripRowView", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("opens vital stat detail on hover", async () => {
    await render(
      <BrowserTestProvider>
        <WarbandStripRowView
          member={member}
          open={false}
          onToggle={() => undefined}
        />
      </BrowserTestProvider>,
    );

    await userEvent.hover(page.getByText("AGI"));
    await expect
      .element(page.getByText("Dodging, fleeing, initiative, and ranged aim."))
      .toBeVisible();
  });

  it("localizes combat contribution tooltips in Polish", async () => {
    await loadLanguage("pl");
    await i18n.changeLanguage("pl");

    await render(
      <BrowserTestProvider>
        <WarbandStripRowView
          member={member}
          open={false}
          onToggle={() => undefined}
        />
      </BrowserTestProvider>,
    );

    await userEvent.hover(page.getByText("DOD"));

    await expect.element(page.getByText("Test bazowy")).toBeVisible();
    await expect.element(page.getByText("Zwinność")).toBeVisible();
  });

  it("expands details from the caret toggle", async () => {
    await render(
      <BrowserTestProvider>
        <StripHarness />
      </BrowserTestProvider>,
    );

    await userEvent.click(
      page.getByRole("button", { name: /toggle vrax detail/i }),
    );

    await expect.element(page.getByTestId("strip-details")).toBeVisible();
    await expect.element(page.getByText("−2 AGILITY")).toBeVisible();
    await expect
      .element(page.getByRole("button", { name: /kick/i }))
      .toBeVisible();
  });

  it("shows a disconnected tag when presence drops", async () => {
    await render(
      <BrowserTestProvider>
        <WarbandStripRowView
          member={member}
          open={false}
          onToggle={() => undefined}
          disconnected
        />
      </BrowserTestProvider>,
    );

    await expect.element(page.getByText("Disconnected")).toBeVisible();
  });
});
