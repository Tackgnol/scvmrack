import { describe, expect, it } from "vitest";
import { scopeOfExclude, scopeToExclude } from "@/components/modifiers/utils";
import {
  blankClassItem,
  changeItemType,
  granterOf,
  itemStamp,
  removeItem,
  abilityIndexOf,
  scopeExclude,
  withSavedKeys,
  blankDraft,
  randomNumber,
  specialistAllowed,
  STEPS,
  draftIssues,
  fieldId,
  formulaText,
  missingCount,
  statRange,
  zineAbilities,
  zineRows,
} from "@/components/organisms/class-creator/classCreator.utils";
import { signed } from "@/utils/signed";
import type { AbilityDraft, ClassDraft, ClassItemDraft } from "@/api/classes";

const ready = (overrides: Partial<ClassDraft> = {}): ClassDraft => ({
  ...blankDraft(),
  name: { en: "Bog Witch", pl: "" },
  description: { en: "The mire keeps what you give it.", pl: "" },
  origins: [{ en: "A drowned village", pl: "" }],
  ...overrides,
});

describe("formulaText", () => {
  it("writes stat dice in book notation with a true minus", () => {
    expect(
      formulaText({ count: 3, faces: 6, modifier: -1, dropLowest: false }),
    ).toBe("3d6 −1");
    expect(
      formulaText({ count: 4, faces: 6, modifier: 0, dropLowest: true }),
    ).toBe("best 3 of 4d6");
    expect(
      formulaText({ count: 1, faces: 8, modifier: 2, dropLowest: true }),
    ).toBe("1d8 +2");
  });
});

describe("statRange", () => {
  it("gives the score and modifier range", () => {
    expect(
      statRange({ count: 3, faces: 6, modifier: -1, dropLowest: false }),
    ).toEqual({
      low: 2,
      high: 17,
      modLow: -3,
      modHigh: 3,
    });
    expect(
      statRange({ count: 4, faces: 6, modifier: 0, dropLowest: true }),
    ).toEqual({
      low: 3,
      high: 18,
      modLow: -3,
      modHigh: 3,
    });
  });
});

describe("signed", () => {
  it("signs numbers with a true minus", () => {
    expect([signed(-2), signed(0), signed(3)]).toEqual(["−2", "0", "+3"]);
  });
});

describe("draftIssues", () => {
  it("is empty for a complete draft", () => {
    expect(draftIssues(ready())).toEqual([]);
  });

  it("knows the step, language and field of every missing text", () => {
    const issues = draftIssues(
      ready({ languages: ["en", "pl"], origins: [{ en: "Pit", pl: "" }] }),
    );
    expect(issues.map((i) => [i.step, i.language, i.path])).toEqual([
      ["identity", "pl", "name.pl"],
      ["identity", "pl", "description.pl"],
      ["origins", "pl", "origins.0.pl"],
    ]);
    expect(missingCount(issues, "pl", "identity")).toBe(2);
    expect(missingCount(issues, "pl")).toBe(3);
    expect(missingCount(issues, "en")).toBe(0);
  });

  it("asks for an origin and refuses Specialist without a random pool", () => {
    expect(
      draftIssues(ready({ origins: [], gettingBetterRule: "specialist" })).map(
        (i) => [i.key, i.path],
      ),
    ).toEqual([
      ["creator.issues.noOrigin", "origins.add"],
      ["creator.issues.specialistPool", "gettingBetterRule"],
    ]);
  });
});

describe("fieldId", () => {
  it("turns a draft path into an element id", () => {
    expect(fieldId("origins.2.pl")).toBe("cc-origins-2-pl");
  });
});

describe("abilities in the draft", () => {
  const ability = (name: string, random: boolean): AbilityDraft => ({
    random,
    name: { en: name, pl: "" },
    text: { en: `${name} rules.`, pl: "" },
    modifiers: [],
    grantItem: null,
    grantPet: null,
  });

  it("puts the Abilities step between Stats & dice and Origins", () => {
    expect(STEPS.filter((s) => s !== "items")).toEqual([
      "identity",
      "stats",
      "abilities",
      "origins",
      "gettingBetter",
      "review",
    ]);
  });

  it("finds missing ability text by field, and a rolled count bigger than the pool", () => {
    const issues = draftIssues(
      ready({
        abilities: [
          ability("Bone-Reader", false),
          { ...ability("", true), text: { en: "", pl: "" } },
        ],
        randomAbilityCount: 2,
      }),
    );
    expect(issues.map((i) => [i.key, i.step, i.path])).toEqual([
      ["creator.issues.missingAbilityName", "abilities", "abilities.1.name.en"],
      [
        "creator.issues.missingAbilityTextUnnamed",
        "abilities",
        "abilities.1.text.en",
      ],
      ["creator.issues.poolTooSmall", "abilities", "randomAbilityCount"],
    ]);
  });

  it("lets Specialist through once the pool beats the rolled count", () => {
    const pool = [ability("A", true), ability("B", true)];
    expect(
      draftIssues(
        ready({
          abilities: pool,
          randomAbilityCount: 1,
          gettingBetterRule: "specialist",
        }),
      ),
    ).toEqual([]);
    expect(
      specialistAllowed(ready({ abilities: pool, randomAbilityCount: 2 })),
    ).toBe(false);
  });

  it("numbers random abilities in pool order", () => {
    const draft = ready({
      abilities: [ability("A", true), ability("B", false), ability("C", true)],
    });
    expect(draft.abilities.map((_, i) => randomNumber(draft, i))).toEqual([
      1,
      null,
      2,
    ]);
  });

  it("turns an ability path into the card that holds it", () => {
    expect(abilityIndexOf("abilities.3.name.pl")).toBe(3);
    expect(abilityIndexOf("origins.0.en")).toBeNull();
  });
});

describe("review fixes", () => {
  const tests = {
    statistic: "presence" as const,
    value: 2,
    exclude: scopeExclude("tests"),
  };

  it("flags the same modifier twice on one ability, at the second one", () => {
    const issues = draftIssues(
      ready({
        abilities: [
          {
            random: false,
            name: { en: "Grave Sense", pl: "" },
            text: { en: "x", pl: "" },
            modifiers: [tests, { ...tests }],
            grantItem: null,
            grantPet: null,
          },
        ],
      }),
    );
    expect(issues.map((i) => [i.key, i.path])).toEqual([
      ["creator.issues.duplicateModifier", "abilities.0.modifiers.1.statistic"],
    ]);
  });

  it("takes the keys a save gave new entries, without touching keyed ones", () => {
    const current = ready({
      origins: [
        { en: "Pit", pl: "" },
        { en: "Bog", pl: "", key: "cc.1.origin.9" },
      ],
    });
    const saved = ready({
      origins: [
        { en: "Pit", pl: "", key: "cc.1.origin.1" },
        { en: "Bog", pl: "", key: "cc.1.origin.2" },
      ],
    });
    expect(withSavedKeys(current, saved).origins.map((o) => o.key)).toEqual([
      "cc.1.origin.1",
      "cc.1.origin.9",
    ]);
  });

  it("takes saved Class Item refs and remaps their grants", () => {
    const flail = { ...blankClassItem("weapon"), ref: "new:flail" };
    const current = ready({
      items: [flail],
      abilities: [
        {
          random: false,
          name: { en: "Flail", pl: "" },
          text: { en: "x", pl: "" },
          modifiers: [],
          grantItem: flail.ref,
          grantPet: null,
        },
      ],
    });
    const saved = ready({
      items: [{ ...flail, ref: "weapons.cc-1-1" }],
      abilities: [
        {
          ...current.abilities[0],
          key: "cc.1.ability.1",
          grantItem: "weapons.cc-1-1",
        },
      ],
    });
    const after = withSavedKeys(current, saved);
    expect(after.items[0].ref).toBe("weapons.cc-1-1");
    expect(after.abilities[0].grantItem).toBe("weapons.cc-1-1");
  });
});

describe("modifier scopes saved before tests, healing, buffs and item use existed", () => {
  it("still read as the preset they were saved with", () => {
    expect(scopeOfExclude(["ranged", "defence", "cast", "ability"])).toBe(
      "melee",
    );
    expect(scopeOfExclude(["defence", "ability"])).toBe("combat");
    expect(scopeOfExclude([])).toBe("all");
    expect(scopeOfExclude(scopeToExclude("tests"))).toBe("tests");
  });
});

describe("Class Items", () => {
  const ability = (
    name: string,
    grant: Partial<AbilityDraft> = {},
  ): AbilityDraft => ({
    random: false,
    name: { en: name, pl: "" },
    text: { en: "x", pl: "" },
    modifiers: [],
    grantItem: null,
    grantPet: null,
    ...grant,
  });
  const item = (
    ref: string,
    type: ClassItemDraft["type"],
    name: string,
  ): ClassItemDraft => ({
    ...blankClassItem(type),
    ref,
    name: { en: name, pl: "" },
  });

  it("puts Class Items between Stats & dice and Abilities", () => {
    expect(STEPS).toEqual([
      "identity",
      "stats",
      "items",
      "abilities",
      "origins",
      "gettingBetter",
      "review",
    ]);
  });

  it("stamps each item in one line", () => {
    const flail = item("new:a", "weapon", "Flail");
    flail.weapon = {
      ...flail.weapon,
      diceCount: 2,
      diceFaces: 4,
      damageModifier: 1,
    };
    const bow = item("new:b", "weapon", "Bow");
    bow.weapon = {
      ...bow.weapon,
      reach: "ranged",
      ammo: "counted",
      ammoCount: 12,
      ammoName: "Bone darts",
    };
    const crow = item("new:c", "pet", "Crow");
    crow.pet = { ...crow.pet, hp: 3, actionDie: 4, humanoid: true };
    const salt = item("new:d", "gear", "Salt");
    salt.gear = {
      kind: "consumable",
      uses: 3,
      effect: "die",
      effectDie: 6,
      statuses: [],
    };
    const stamps = [
      flail,
      bow,
      crow,
      salt,
      item("new:e", "armor", "Plate"),
    ].map((i) => itemStamp(i));
    expect(stamps).toEqual([
      "2d4 +1 · melee",
      "1d6 · ranged · 12 bone darts",
      "3 HP · d4 attack · humanoid",
      "consumable · 3 uses · d6 effect",
      "armor tier 1",
    ]);
  });

  it("knows which ability grants an item, and flags items nobody grants", () => {
    const draft = ready({
      items: [item("new:a", "weapon", "Flail"), item("new:b", "pet", "Crow")],
      abilities: [ability("Flail", { grantItem: "new:a" })],
    });
    expect(granterOf(draft, "new:a")).toEqual({ index: 0, slot: "grantItem" });
    expect(granterOf(draft, "new:b")).toBeNull();
    expect(draftIssues(draft).map((i) => [i.key, i.step, i.path])).toEqual([
      ["creator.issues.itemNotGranted", "abilities", "items.1.grant"],
    ]);
  });

  it("changes an item type, moving its grant to the right slot or leaving it waiting", () => {
    const draft = ready({
      items: [item("new:a", "weapon", "Hound"), item("new:b", "pet", "Crow")],
      abilities: [
        ability("Pack", { grantItem: "new:a" }),
        ability("Murder", { grantItem: null, grantPet: "new:b" }),
      ],
    });
    const moved = changeItemType(draft, 0, "pet");
    expect(moved.items[0].type).toBe("pet");
    expect(moved.abilities[0]).toMatchObject({
      grantItem: null,
      grantPet: "new:a",
    });

    const taken = changeItemType(
      ready({
        ...draft,
        abilities: [ability("Pack", { grantItem: "new:a", grantPet: "new:b" })],
      }),
      0,
      "pet",
    );
    expect(taken.abilities[0]).toMatchObject({
      grantItem: null,
      grantPet: "new:b",
    });
  });

  it("removes an item and every grant of it", () => {
    const draft = ready({
      items: [item("new:a", "weapon", "Flail")],
      abilities: [ability("Flail", { grantItem: "new:a" })],
    });
    const after = removeItem(draft, 0);
    expect(after.items).toEqual([]);
    expect(after.abilities[0].grantItem).toBeNull();
  });
});

describe("zine paste", () => {
  it("removes a die header and row numbering", () => {
    expect(zineRows("d6 DECOCTIONS\n1. Grave salt\n2) Bone broth")).toEqual([
      "Grave salt",
      "Bone broth",
    ]);
  });

  it("splits zine ability entries without breaking St. or Mt. names", () => {
    expect(
      zineAbilities(
        "St. Varg: Call the dead\nMt. Skull — Climb its ribs\nGrave Sense. Smell the dead",
      ),
    ).toEqual([
      { name: "St. Varg", text: "Call the dead" },
      { name: "Mt. Skull", text: "Climb its ribs" },
      { name: "Grave Sense", text: "Smell the dead" },
    ]);
  });
});
