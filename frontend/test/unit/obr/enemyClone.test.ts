import { expect, test, vi } from "vitest";

// The rpgtools-owlbear package root runtime-imports the OBR SDK, which only
// resolves in a browser bundle; the helpers under test never touch it.
vi.mock("@owlbear-rodeo/sdk", () => ({
  default: {},
  buildLabel: () => ({}),
}));

import { cloneEnemy, nextCloneName } from "../../../src/obr/enemyClone.ts";
import type { ObrEnemy } from "../../../src/obr/enemies.ts";

test("nextCloneName numbers the first clone 2", () => {
  expect(nextCloneName("Skeleton", ["Skeleton"])).toBe("Skeleton 2");
});

test("nextCloneName continues past the highest existing suffix", () => {
  expect(
    nextCloneName("Skeleton", ["Skeleton", "Skeleton 2", "Skeleton 5"]),
  ).toBe("Skeleton 6");
});

test("nextCloneName strips a numeric suffix from the source name", () => {
  expect(nextCloneName("Skeleton 3", ["Skeleton 3"])).toBe("Skeleton 4");
});

test("nextCloneName ignores names that merely share a prefix", () => {
  expect(
    nextCloneName("Skeleton", ["Skeleton", "Skeleton King", "Skeletons 4"]),
  ).toBe("Skeleton 2");
});

test("cloneEnemy issues fresh ids and a numbered name", () => {
  const source: ObrEnemy = {
    id: "abc123",
    partyId: "party-1",
    name: "Goblin",
    type: "Beast",
    habitat: "Caves",
    description: "gm notes",
    playerDescription: "smells bad",
    currentHealth: 5,
    healthPercent: 63,
    maxHealth: 8,
    morale: 7,
    armorDie: "-d2",
    armorDescription: "",
    attacks: [{ id: "row-1", name: "Bite", die: "d4" }],
    specials: [{ id: "row-2", name: "Sneak", description: "" }],
    loot: [{ id: "row-3", label: "Head", value: "5s" }],
    statuses: [{ id: "healthy", percent: 100, label: "Healthy" }],
  };

  const clone = cloneEnemy(source, ["Goblin", "Goblin 2"]);

  expect(clone.name).toBe("Goblin 3");
  expect(clone.id).not.toBe(source.id);
  expect(clone.id.startsWith("enemy-")).toBe(true);
  expect(clone.partyId).toBeUndefined();
  expect(clone.attacks[0].id).not.toBe("row-1");
  expect(clone.attacks[0].name).toBe("Bite");
  expect(clone.specials[0].id).not.toBe("row-2");
  expect(clone.loot[0].id).not.toBe("row-3");
  expect(clone.currentHealth).toBe(5);
});
