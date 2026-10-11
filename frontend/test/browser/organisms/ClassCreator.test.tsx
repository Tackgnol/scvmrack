import { render } from "vitest-browser-react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import BrowserTestProvider from "../BrowserTestProvider";
import { ClassCreator } from "@/components/organisms/class-creator/ClassCreator/ClassCreator";
import {
  blankClassItem,
  blankDraft,
} from "@/components/organisms/class-creator/classCreator.utils";
import { saveClass, testRollClass, type ClassDraft } from "@/api/classes";

vi.mock("@/api/classes", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/classes")>()),
  saveClass: vi.fn(),
  testRollClass: vi.fn(),
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

const complete = (): ClassDraft => ({
  ...blankDraft(),
  name: { en: "Bog Witch", pl: "" },
  description: { en: "The mire keeps what you give it.", pl: "" },
  origins: [{ en: "A drowned village", pl: "" }],
});

function renderCreator(
  draft: ClassDraft = blankDraft(),
  classId: number | null = null,
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserTestProvider>
        <ClassCreator classId={classId} initialDraft={draft} />
      </BrowserTestProvider>
    </QueryClientProvider>,
  );
}

const title = () => page.getByRole("heading", { level: 2 });

describe("ClassCreator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("walks the steps with named Back and Next buttons, and Alt+arrows", async () => {
    renderCreator();

    await expect.element(title()).toHaveTextContent("Identity");
    await page.getByRole("button", { name: "Stats & dice" }).last().click();
    await expect.element(title()).toHaveTextContent("Stats & dice");
    await expect
      .element(page.getByRole("button", { name: "Class Items" }).last())
      .toBeVisible();

    await userEvent.keyboard("{Alt>}{ArrowRight}{/Alt}");
    await expect.element(title()).toHaveTextContent("Class Items");
    await userEvent.keyboard("{Alt>}{ArrowLeft}{/Alt}");
    await expect.element(title()).toHaveTextContent("Stats & dice");
  });

  it("stamps a stat in book notation as its dice change", async () => {
    renderCreator();
    await page
      .getByRole("button", { name: /Stats & dice/ })
      .first()
      .click();

    const strength = page.getByRole("region", { name: "STR dice" });
    await strength.getByRole("radio", { name: "Dropped" }).click();
    await strength.getByRole("spinbutton", { name: "Dice" }).click();
    await userEvent.keyboard("{ArrowUp}");
    await strength.getByRole("spinbutton", { name: "Modifier" }).click();
    await userEvent.keyboard("{ArrowDown}");

    await expect.element(strength.getByText("best 3 of 4d6 −1")).toBeVisible();
    await expect.element(strength.getByText("score 2–17")).toBeVisible();
  });

  it("shows what each language misses, and a Fix jumps there and focuses the field", async () => {
    renderCreator({ ...complete(), languages: ["en", "pl"] });

    await expect
      .element(page.getByRole("radio", { name: /Polish 2 missing/ }))
      .toBeVisible();
    await page
      .getByRole("button", { name: /Test roll & save/ })
      .first()
      .click();
    await page
      .getByRole("button", { name: /Polish missing: class description/ })
      .click();

    await expect.element(title()).toHaveTextContent("Identity");
    await expect
      .element(
        page
          .getByRole("radiogroup", { name: "Writing in" })
          .getByRole("radio", { name: /Polish/ }),
      )
      .toHaveAttribute("aria-checked", "true");
    await expect.element(page.getByLabelText("Description")).toHaveFocus();
    await expect
      .element(page.getByLabelText("Description"))
      .toHaveAttribute("aria-invalid", "true");
  });

  it("explains a blocked save as one pink interrupt", async () => {
    renderCreator();
    await page
      .getByRole("button", { name: /Test roll & save/ })
      .first()
      .click();

    await page.getByRole("button", { name: "Save class" }).click();

    await expect
      .element(page.getByText(/Save is blocked: 3 things to fix/))
      .toBeVisible();
    expect(saveClass).not.toHaveBeenCalled();
  });

  it("saves a complete class, stamps it FORGED and offers the way to my classes", async () => {
    vi.mocked(saveClass).mockResolvedValue({ id: 12, draft: complete() });
    renderCreator(complete());
    await page
      .getByRole("button", { name: /Test roll & save/ })
      .first()
      .click();

    await page.getByRole("button", { name: "Save class" }).click();

    await expect.element(page.getByText("Forged")).toBeVisible();
    await expect
      .element(page.getByRole("link", { name: /Go to my classes/ }))
      .toHaveAttribute("href", "/gm/classes");
    await expect
      .element(page.getByRole("button", { name: "Saved" }))
      .toBeDisabled();
    expect(saveClass).toHaveBeenCalledWith({ id: null, draft: complete() });
  });

  it("says when the draft changed since the test roll", async () => {
    vi.mocked(testRollClass).mockResolvedValue({
      name: "Nameless Wretch",
      strength: 10,
      agility: 10,
      presence: 10,
      toughness: 10,
      maxHp: 6,
      omens: 2,
      silver: 70,
      origin: "A drowned village",
      equippedWeapons: [{ name: "Femur" }],
      abilities: [{ key: "Bone-Reader", name: "Bone-Reader" }],
    });
    renderCreator(complete());
    await page
      .getByRole("button", { name: /Test roll & save/ })
      .first()
      .click();

    await page.getByRole("button", { name: "Roll a test scvm" }).click();
    await expect.element(page.getByText("Nameless Wretch")).toBeVisible();
    await expect.element(page.getByText("Femur")).toBeVisible();
    await expect.element(page.getByText("Bone-Reader")).toBeVisible();

    await page
      .getByRole("button", { name: /Origins/ })
      .first()
      .click();
    await page.getByRole("button", { name: "Add origin" }).click();
    await page
      .getByRole("button", { name: /Test roll & save/ })
      .first()
      .click();

    await expect
      .element(
        page.getByText(
          "The draft changed since this roll. Roll again to see it.",
        ),
      )
      .toBeVisible();
    expect(testRollClass).toHaveBeenCalledWith({
      draft: complete(),
      language: "en",
      locale: "en",
    });
  });

  it("shows a server refusal as the blocked-save message, and saves edits to the class", async () => {
    vi.mocked(saveClass).mockRejectedValueOnce(
      Object.assign(
        new Error("You have 50 classes, the most one account can hold."),
        {
          status: 409,
          payload: {
            message: "You have 50 classes, the most one account can hold.",
            code: "CLASS_LIMIT_REACHED",
            statusCode: 409,
          },
        },
      ),
    );
    vi.mocked(saveClass).mockResolvedValueOnce({ id: 7, draft: complete() });
    renderCreator(complete(), 7);
    await page
      .getByRole("button", { name: /Test roll & save/ })
      .first()
      .click();

    await page.getByRole("button", { name: "Save class" }).click();
    await expect.element(page.getByText(/You have 50 classes/)).toBeVisible();
    await page.getByRole("button", { name: "Save class" }).click();

    await expect.element(page.getByText("Forged")).toBeVisible();
    expect(vi.mocked(saveClass).mock.calls.map(([input]) => input.id)).toEqual([
      7, 7,
    ]);
  });

  it("only lets a stat drop its lowest die when it rolls two or more", async () => {
    renderCreator();
    await page
      .getByRole("button", { name: /Stats & dice/ })
      .first()
      .click();
    const strength = page.getByRole("region", { name: "STR dice" });

    await strength.getByRole("radio", { name: "Dropped" }).click();
    await strength.getByRole("button", { name: "Decrease Dice" }).click();
    await strength.getByRole("button", { name: "Decrease Dice" }).click();

    await expect
      .element(strength.getByRole("radio", { name: "Dropped" }))
      .toBeDisabled();
    await expect
      .element(strength.getByText("1d6", { exact: true }))
      .toBeVisible();
  });

  it("writes an ability with a tests-only modifier, and the closed card shows it", async () => {
    renderCreator(complete());
    await page
      .getByRole("button", { name: /Abilities/ })
      .first()
      .click();

    await page.getByRole("button", { name: "Add ability" }).click();
    await expect
      .element(page.getByLabelText("Name", { exact: true }))
      .toHaveFocus();
    await userEvent.keyboard("Grave Sense");
    await page
      .getByLabelText("Rules text")
      .fill("Smell the dead through walls.");
    await page.getByRole("radio", { name: "Random" }).click();
    await page.getByRole("button", { name: "Add modifier" }).click();
    await page.getByRole("radio", { name: "PRE" }).click();
    await page.getByRole("spinbutton", { name: "Value" }).fill("2");
    await userEvent.keyboard("{Enter}");
    await page.getByRole("radio", { name: "Tests only" }).click();
    await page.getByRole("button", { name: "Done" }).click();

    const card = page.getByRole("button", { name: /Grave Sense/ });
    await expect.element(card).toHaveTextContent("Random 1");
    await expect.element(card).toHaveTextContent("+2 PRE tests");
    await expect.element(card).toHaveFocus();
    await expect.element(page.getByText("1 of 20 abilities")).toBeVisible();
  });

  it("rolls no more random abilities than the pool holds, and Fix opens the card with the gap", async () => {
    renderCreator({
      ...complete(),
      abilities: [
        {
          random: true,
          name: { en: "Grave Sense", pl: "" },
          text: { en: "", pl: "" },
          modifiers: [],
          grantItem: null,
          grantPet: null,
        },
      ],
    });
    await page
      .getByRole("button", { name: /Abilities/ })
      .first()
      .click();

    const rolled = page.getByRole("spinbutton", {
      name: "Random abilities rolled",
    });
    await rolled.click();
    await userEvent.keyboard("{ArrowUp}{ArrowUp}");
    await expect.element(rolled).toHaveAttribute("aria-valuenow", "1");

    await page
      .getByRole("button", { name: /Test roll & save/ })
      .first()
      .click();
    await page
      .getByRole("button", {
        name: /English missing: “Grave Sense” rules text/,
      })
      .click();

    await expect.element(page.getByLabelText("Rules text")).toHaveFocus();
    await expect
      .element(page.getByLabelText("Rules text"))
      .toHaveAttribute("aria-invalid", "true");
  });

  it("reorders abilities with Alt+Up", async () => {
    renderCreator({
      ...complete(),
      abilities: [
        {
          random: true,
          name: { en: "Bone-Reader", pl: "" },
          text: { en: "Ask a skull.", pl: "" },
          modifiers: [],
          grantItem: null,
          grantPet: null,
        },
        {
          random: true,
          name: { en: "Grave Sense", pl: "" },
          text: { en: "Smell the dead.", pl: "" },
          modifiers: [],
          grantItem: null,
          grantPet: null,
        },
      ],
    });
    await userEvent.click(
      page.getByRole("button", { name: /Abilities/ }).first(),
    );

    const grip = page.getByRole("button", { name: "Move Grave Sense" });
    await userEvent.click(grip);
    await userEvent.keyboard("{Escape}");
    await userEvent.keyboard("{Alt>}{ArrowUp}{/Alt}");

    await expect
      .element(page.getByTestId("reorder-abilities-0"))
      .toHaveTextContent("Grave Sense");
  });
  it("duplicates and removes abilities from the open card", async () => {
    renderCreator({
      ...complete(),
      abilities: [
        {
          random: false,
          name: { en: "Bone-Reader", pl: "" },
          text: { en: "Ask a skull.", pl: "" },
          modifiers: [],
          grantItem: null,
          grantPet: null,
        },
      ],
    });
    await page
      .getByRole("button", { name: /Abilities/ })
      .first()
      .click();
    await page.getByRole("button", { name: /Bone-Reader/ }).click();

    await page.getByRole("button", { name: "Duplicate" }).click();
    await expect.element(page.getByText("2 of 20 abilities")).toBeVisible();
    await page.getByRole("button", { name: "Remove" }).click();

    await expect.element(page.getByText("1 of 20 abilities")).toBeVisible();
    await expect
      .element(page.getByRole("button", { name: /Bone-Reader/ }))
      .toHaveFocus();
  });

  it("asks about Class Items first, and No reads None on the rail", async () => {
    renderCreator(complete());
    await userEvent.click(
      page.getByRole("button", { name: /Class Items/ }).first(),
    );

    await expect
      .element(page.getByText("Does this class carry its own gear or beasts?"))
      .toBeVisible();
    await userEvent.click(
      page.getByRole("button", { name: "No, only catalog gear" }),
    );

    await expect
      .element(page.getByText(/No Class Items\. Abilities can still grant/))
      .toBeVisible();
    await expect
      .element(page.getByRole("button", { name: /Class Items/ }).first())
      .toHaveTextContent("None");
  });

  it("forges a weapon that waits for an ability, then grants it from a new one", async () => {
    renderCreator(complete());
    await userEvent.click(
      page.getByRole("button", { name: /Class Items/ }).first(),
    );
    await userEvent.click(
      page.getByRole("button", { name: "Yes, forge a Class Item" }),
    );
    await userEvent.click(
      page.getByRole("button", { name: "Weapon", exact: true }),
    );

    await expect
      .element(page.getByLabelText("Name", { exact: true }))
      .toHaveFocus();
    await userEvent.keyboard("Reliquary Flail");
    await userEvent.fill(
      page.getByRole("spinbutton", { name: "Damage dice" }),
      "2",
    );
    await userEvent.keyboard("{Enter}");
    await expect.element(page.getByText("2d6 · melee").first()).toBeVisible();
    await expect.element(page.getByText("Not granted yet")).toBeVisible();

    await userEvent.click(
      page.getByRole("button", { name: "Grant from a new ability" }),
    );

    await expect.element(title()).toHaveTextContent("Abilities");
    await expect.element(page.getByLabelText("Rules text")).toHaveFocus();
    await expect
      .element(page.getByLabelText("Name", { exact: true }))
      .toHaveValue("Reliquary Flail");
    await expect.element(page.getByText("2d6 · melee")).toBeVisible();
    await expect.element(page.getByRole("button", { name: "Edit stats" })).toBeVisible();
    await expect
      .element(page.getByText("Class Items waiting for an ability"))
      .not.toBeInTheDocument();
  });

  it("allows gear to give temporary status effects", async () => {
    const snuff = {
      ...blankClassItem("gear"),
      ref: "new:snuff",
      name: { en: "Hyphos Snuff", pl: "" },
    };
    renderCreator({
      ...complete(),
      items: [snuff],
      abilities: [
        {
          random: false,
          name: { en: "Snuff", pl: "" },
          text: { en: "x", pl: "" },
          modifiers: [],
          grantItem: snuff.ref,
          grantPet: null,
        },
      ],
    });
    await userEvent.click(
      page.getByRole("button", { name: /Class Items/ }).first(),
    );
    await userEvent.click(page.getByRole("button", { name: /Hyphos Snuff/ }));
    await userEvent.click(page.getByRole("button", { name: "Add modifier" }));
    await expect
      .element(page.getByText("Temporary status effects"))
      .toBeVisible();
  });

  it("undoes one ability grant in one step", async () => {
    const flail = {
      ...blankClassItem("weapon"),
      ref: "new:flail",
      name: { en: "Reliquary Flail", pl: "" },
    };
    renderCreator({
      ...complete(),
      items: [flail],
      abilities: [{
        random: false,
        name: { en: "Bone-Reader", pl: "" },
        text: { en: "Ask a skull.", pl: "" },
        modifiers: [],
        grantItem: null,
        grantPet: null,
      }],
    });
    await userEvent.click(page.getByRole("button", { name: /Abilities/ }).first());
    await userEvent.click(page.getByRole("button", { name: /Bone-Reader/ }));

    await userEvent.click(page.getByRole("combobox", { name: "Grants an item" }));
    await expect.element(page.getByRole("option", { name: "Reliquary Flail" })).toBeVisible();
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await expect.element(page.getByRole("button", { name: "Edit stats" })).toBeVisible();

    await userEvent.click(page.getByRole("button", { name: /Undo/ }));
    await expect.element(page.getByRole("button", { name: "Edit stats" })).not.toBeInTheDocument();
  });

  it("lists waiting items on Abilities and blocks forging into a taken slot, naming the item", async () => {
    const flail = {
      ...blankClassItem("weapon"),
      ref: "new:flail",
      name: { en: "Flail", pl: "" },
    };
    const salt = {
      ...blankClassItem("gear"),
      ref: "new:salt",
      name: { en: "Salt", pl: "" },
    };
    renderCreator({
      ...complete(),
      items: [flail, salt],
      abilities: [
        {
          random: false,
          name: { en: "Bone-Reader", pl: "" },
          text: { en: "x", pl: "" },
          modifiers: [],
          grantItem: "new:flail",
          grantPet: null,
        },
      ],
    });
    await userEvent.click(
      page.getByRole("button", { name: /Abilities/ }).first(),
    );

    await expect
      .element(page.getByText("Class Items waiting for an ability"))
      .toBeVisible();
    await expect
      .element(
        page.getByRole("button", { name: "Grant Salt from a new ability" }),
      )
      .toBeVisible();

    await userEvent.click(page.getByRole("button", { name: /Bone-Reader/ }));
    await userEvent.click(
      page.getByRole("button", { name: "Forge a Class Item for this ability" }),
    );
    await expect
      .element(
        page.getByRole("button", {
          name: "Armor: This ability already grants “Flail”",
        }),
      )
      .toBeDisabled();
    await expect
      .element(page.getByRole("button", { name: "Pet", exact: true }))
      .toBeEnabled();
  });

  it("asks before removing a granted item, naming its ability, and the ability then grants nothing", async () => {
    const flail = {
      ...blankClassItem("weapon"),
      ref: "new:flail",
      name: { en: "Flail", pl: "" },
    };
    renderCreator({
      ...complete(),
      items: [flail],
      abilities: [
        {
          random: false,
          name: { en: "Bone-Reader", pl: "" },
          text: { en: "x", pl: "" },
          modifiers: [],
          grantItem: "new:flail",
          grantPet: null,
        },
      ],
    });
    await userEvent.click(
      page.getByRole("button", { name: /Class Items/ }).first(),
    );
    await userEvent.click(page.getByRole("button", { name: /Flail/ }));
    await userEvent.click(
      page.getByRole("button", { name: "Remove", exact: true }),
    );

    await expect
      .element(
        page.getByText(
          "“Flail” is granted by the ability “Bone-Reader”. Remove the item and clear that grant?",
        ),
      )
      .toBeVisible();
    await userEvent.click(
      page.getByRole("button", { name: "Remove and clear" }),
    );

    await expect
      .element(page.getByText("Does this class carry its own gear or beasts?"))
      .toBeVisible();
  });

  it("adds origins up to the cap and focuses the new one", async () => {
    renderCreator();
    await page
      .getByRole("button", { name: /Origins/ })
      .first()
      .click();

    await page.getByRole("button", { name: "Add origin" }).click();

    await expect
      .element(page.getByLabelText("Origin 1", { exact: true }))
      .toHaveFocus();
    await expect.element(page.getByText("1 of 20 origins")).toBeVisible();
  });
});
