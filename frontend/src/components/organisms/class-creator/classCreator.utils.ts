import type {
  AbilityDraft,
  AbilityModifierDraft,
  ClassDraft,
  ClassItemDraft,
  ClassItemType,
  ClassLanguage,
  Localized,
  StatDice,
} from "@/api/classes";
import type { TFunction } from "i18next";
import type { ScopeOption } from "@/components/modifiers/types";
import { scopeOfExclude, scopeToExclude } from "@/components/modifiers/utils";
import { signed } from "@/utils/signed";
import { statToModifier } from "@/utils/stats";
import type {
  CreatorIssue,
  CreatorStep,
  GrantSlot,
} from "./classCreator.models";

export const LIMIT_LIST = 20;
export const LIMIT_TEXT = 1500;
export const LIMIT_NAME = 100;

/** The creator's steps in order: Class Items come before Abilities, so abilities can grant them. */
export const STEPS: CreatorStep[] = [
  "identity",
  "stats",
  "items",
  "abilities",
  "origins",
  "gettingBetter",
  "review",
];

export const MAX_MODIFIERS = 6;
const empty = (): Localized => ({ en: "", pl: "" });
const bookStat = (): StatDice => ({
  count: 3,
  faces: 6,
  modifier: 0,
  dropLowest: false,
});

/** A new class: the book's defaults and no text yet. */
export function blankDraft(): ClassDraft {
  return {
    languages: ["en"],
    name: empty(),
    description: empty(),
    stats: {
      strength: bookStat(),
      agility: bookStat(),
      presence: bookStat(),
      toughness: bookStat(),
    },
    hpDie: 8,
    omenDie: 2,
    weaponDie: 10,
    armorDie: 4,
    silver: { count: 2, faces: 6, multiplier: 10 },
    origins: [],
    abilities: [],
    randomAbilityCount: 0,
    items: [],
    gettingBetterRule: "book",
    gettingBetterNote: empty(),
  };
}

/** How a stat is rolled, in book notation: `3d6 −1`, `best 3 of 4d6`. */
export function formulaText(stat: StatDice): string {
  const mod = stat.modifier ? ` ${signed(stat.modifier)}` : "";
  const dice = `${stat.count}d${stat.faces}`;
  return stat.dropLowest && stat.count > 1
    ? `best ${stat.count - 1} of ${dice}${mod}`
    : `${dice}${mod}`;
}

/** The lowest and highest score a stat can roll, and their modifiers. */
export function statRange(stat: StatDice) {
  const kept = stat.dropLowest && stat.count > 1 ? stat.count - 1 : stat.count;
  const low = kept + stat.modifier;
  const high = kept * stat.faces + stat.modifier;
  return {
    low,
    high,
    modLow: statToModifier(low),
    modHigh: statToModifier(high),
  };
}

/** The element id of the field at a draft path, so issues and re-renders can focus it. */
export function fieldId(path: string): string {
  return `cc-${path.replace(/\./g, "-")}`;
}

/** Everything that blocks saving, each knowing the step, language and field to fix it in. */
export function draftIssues(draft: ClassDraft): CreatorIssue[] {
  const issues: CreatorIssue[] = [];
  const text = (
    value: Localized,
    base: string,
    step: CreatorStep,
    key: string,
    params: Record<string, unknown> = {},
  ) => {
    for (const language of draft.languages) {
      if (!value[language].trim()) {
        issues.push({
          key,
          params: { ...params, language },
          step,
          language,
          path: `${base}.${language}`,
        });
      }
    }
  };
  text(draft.name, "name", "identity", "creator.issues.missingName");
  text(
    draft.description,
    "description",
    "identity",
    "creator.issues.missingDescription",
  );
  draft.abilities.forEach((ability, i) => {
    const named = ability.name[draft.languages[0]].trim();
    const params = { n: i + 1, name: named };
    text(
      ability.name,
      `abilities.${i}.name`,
      "abilities",
      "creator.issues.missingAbilityName",
      params,
    );
    text(
      ability.text,
      `abilities.${i}.text`,
      "abilities",
      named
        ? "creator.issues.missingAbilityText"
        : "creator.issues.missingAbilityTextUnnamed",
      params,
    );
    const seen = new Set<string>();
    ability.modifiers.forEach((modifier, m) => {
      const id = JSON.stringify([
        modifier.statistic,
        modifier.value,
        [...modifier.exclude].sort(),
      ]);
      if (seen.has(id)) {
        issues.push({
          key: "creator.issues.duplicateModifier",
          params: { n: i + 1, name: named || i + 1 },
          step: "abilities",
          path: `abilities.${i}.modifiers.${m}.statistic`,
        });
      }
      seen.add(id);
    });
  });
  draft.items.forEach((item, i) => {
    text(
      item.name,
      `items.${i}.name`,
      "items",
      "creator.issues.missingItemName",
      { n: i + 1 },
    );
  });
  draft.items.forEach((item, i) => {
    if (!granterOf(draft, item.ref)) {
      issues.push({
        key: "creator.issues.itemNotGranted",
        params: { name: item.name[draft.languages[0]] || i + 1 },
        step: "abilities",
        path: `items.${i}.grant`,
      });
    }
  });
  const pool = randomPoolSize(draft);
  if (draft.randomAbilityCount > pool) {
    issues.push({
      key: "creator.issues.poolTooSmall",
      params: { count: draft.randomAbilityCount, pool },
      step: "abilities",
      path: "randomAbilityCount",
    });
  }
  draft.origins.forEach((origin, i) =>
    text(origin, `origins.${i}`, "origins", "creator.issues.missingOrigin", {
      n: i + 1,
    }),
  );
  if (draft.origins.length === 0) {
    issues.push({
      key: "creator.issues.noOrigin",
      params: {},
      step: "origins",
      path: "origins.add",
    });
  }
  if (draft.gettingBetterRule === "specialist" && !specialistAllowed(draft)) {
    issues.push({
      key: "creator.issues.specialistPool",
      params: {},
      step: "gettingBetter",
      path: "gettingBetterRule",
    });
  }
  return issues;
}

export const STEP_TITLE_ID = "step-title";

/**
 * Focuses the control at a draft path, or the step title when null, once the
 * render the current event triggers has drawn it. A radio group focuses its
 * chosen radio.
 */
export function focusAfterRender(path: string | null): void {
  requestAnimationFrame(() => focusPath(path));
}

function focusPath(path: string | null): void {
  const target = document.getElementById(
    path === null ? STEP_TITLE_ID : fieldId(path),
  );
  if (!target) return;
  const radio =
    target.getAttribute("role") === "radiogroup"
      ? target.querySelector<HTMLElement>('[role="radio"][tabindex="0"]')
      : null;
  (radio ?? target).focus();
  if (path === null) window.scrollTo?.({ top: 0 });
}

/** How many issues are missing text in `language`, on one step or across all. */
export function missingCount(
  issues: CreatorIssue[],
  language: ClassLanguage,
  step?: CreatorStep,
): number {
  return issues.filter(
    (i) => i.language === language && (!step || i.step === step),
  ).length;
}

/** How many abilities are in the random pool. */
export function randomPoolSize(draft: ClassDraft): number {
  return draft.abilities.filter((a) => a.random).length;
}

/** Specialist rerolls specialties from the pool, so it needs one more random ability than each scvm rolls. */
export function specialistAllowed(draft: ClassDraft): boolean {
  return randomPoolSize(draft) >= draft.randomAbilityCount + 1;
}

/** A random ability's number in the pool (1-based, in list order); null for a fixed one. */
export function randomNumber(draft: ClassDraft, index: number): number | null {
  if (!draft.abilities[index]?.random) return null;
  return draft.abilities.slice(0, index + 1).filter((a) => a.random).length;
}

/** The ability card a draft path points into, e.g. `abilities.3.name.pl` → 3. */
export function abilityIndexOf(path: string): number | null {
  const match = /^abilities\.(\d+)\./.exec(path);
  return match ? Number(match[1]) : null;
}

/** Which preset a modifier's exclusions match, as the sheet reads it. */
export function modifierScope(modifier: AbilityModifierDraft): ScopeOption {
  return scopeOfExclude(modifier.exclude);
}

export { scopeToExclude as scopeExclude };

/** A new ability, fixed unless said otherwise, with no text yet. */
export function blankAbility(random = false): AbilityDraft {
  return {
    random,
    name: { en: "", pl: "" },
    text: { en: "", pl: "" },
    modifiers: [],
    grantItem: null,
    grantPet: null,
  };
}

/**
 * The draft with the keys the save gave its new origins and abilities, matched by
 * position; an entry already keyed, or moved since, keeps what it has.
 */
export function withSavedKeys(
  current: ClassDraft,
  saved: ClassDraft,
): ClassDraft {
  const fill = <T extends { key?: string }>(
    list: T[],
    keyed: Array<{ key?: string }>,
  ): T[] =>
    list.map((entry, i) =>
      entry.key || !keyed[i]?.key ? entry : { ...entry, key: keyed[i].key },
    );
  const savedItemRefs = new Map<string, string>();
  const items = current.items.map((item, i) => {
    const savedItem = saved.items[i];
    if (
      !item.ref.startsWith("new:") ||
      !savedItem ||
      item.type !== savedItem.type
    )
      return item;
    savedItemRefs.set(item.ref, savedItem.ref);
    return { ...item, ref: savedItem.ref };
  });
  const savedRef = (ref: string | null) =>
    ref ? (savedItemRefs.get(ref) ?? ref) : null;
  return {
    ...current,
    origins: fill(current.origins, saved.origins),
    abilities: fill(current.abilities, saved.abilities).map((ability) => ({
      ...ability,
      grantItem: savedRef(ability.grantItem),
      grantPet: savedRef(ability.grantPet),
    })),
    items,
  };
}

/** A new Class Item of a type, with the book's usual numbers and no text yet. */
export function blankClassItem(type: ClassItemType): ClassItemDraft {
  return {
    ref: `new:${crypto.randomUUID()}`,
    type,
    name: { en: "", pl: "" },
    description: { en: "", pl: "" },
    value: 0,
    weapon: {
      diceCount: 1,
      diceFaces: 6,
      damageModifier: 0,
      reach: "melee",
      ammo: "none",
      ammoCount: 10,
      ammoName: "",
      modifiers: [],
    },
    armor: { tier: 1, modifiers: [] },
    gear: {
      kind: "carried",
      uses: 0,
      effect: "text",
      effectDie: 6,
      statuses: [],
    },
    pet: { hp: 4, actionDie: 4, action: "attack", humanoid: false, buffs: [] },
  };
}

/** The grant slot an item of a type sits in: pets in the pet slot, everything else in the item slot. */
export const slotFor = (type: ClassItemType): GrantSlot =>
  type === "pet" ? "grantPet" : "grantItem";

/** The ability (and slot) that grants an item, or null when it waits for one. */
export function granterOf(
  draft: ClassDraft,
  ref: string,
): { index: number; slot: GrantSlot } | null {
  for (const [index, ability] of draft.abilities.entries()) {
    if (ability.grantItem === ref) return { index, slot: "grantItem" };
    if (ability.grantPet === ref) return { index, slot: "grantPet" };
  }
  return null;
}

/** An item's one-line result stamp, e.g. `2d4 +1 · melee`. Words come from `t` when given. */
export function itemStamp(item: ClassItemDraft, t?: TFunction): string {
  const say = (
    key: string,
    fallback: string,
    params?: Record<string, unknown>,
  ) =>
    t
      ? t(`creator.items.stamp.${key}`, fallback, params)
      : fallback.replace(/\{\{(\w+)\}\}/g, (_, k) => String(params?.[k]));
  switch (item.type) {
    case "weapon": {
      const w = item.weapon;
      const damage = `${w.diceCount}d${w.diceFaces}${w.damageModifier ? ` ${signed(w.damageModifier)}` : ""}`;
      const reach = say(w.reach, w.reach);
      const ammo =
        w.reach !== "ranged" || w.ammo === "none"
          ? []
          : w.ammo === "endless"
            ? [say("endless", "endless ammo")]
            : [
                `${w.ammoCount} ${(w.ammoName.trim() || say("ammo", "ammo")).toLowerCase()}`,
              ];
      return [damage, reach, ...ammo].join(" · ");
    }
    case "armor":
      return say("armorTier", "armor tier {{tier}}", { tier: item.armor.tier });
    case "pet": {
      const p = item.pet;
      return [
        say("hp", "{{hp}} HP", { hp: p.hp }),
        p.action === "buff"
          ? say("buff", "d{{die}} buff", { die: p.actionDie })
          : say("attack", "d{{die}} attack", { die: p.actionDie }),
        ...(p.humanoid ? [say("humanoid", "humanoid")] : []),
      ].join(" · ");
    }
    case "gear": {
      const g = item.gear;
      return [
        say(g.kind, g.kind),
        ...(g.uses ? [say("uses", "{{count}} uses", { count: g.uses })] : []),
        ...(g.effect === "damage"
          ? [say("damage", "d{{die}} damage", { die: g.effectDie })]
          : []),
        ...(g.effect === "die"
          ? [say("effect", "d{{die}} effect", { die: g.effectDie })]
          : []),
      ].join(" · ");
    }
  }
}

/**
 * The draft with item `index` changed to `type`. Name, description, value and
 * every type's numbers stay; the grant moves to the matching slot of the same
 * ability, or is cleared (the item waits) when that slot is taken.
 */
export function changeItemType(
  draft: ClassDraft,
  index: number,
  type: ClassItemType,
): ClassDraft {
  const item = draft.items[index];
  if (item.type === type) return draft;
  const granter = granterOf(draft, item.ref);
  const to = slotFor(type);
  const abilities = draft.abilities.map((ability, i) => {
    if (!granter || i !== granter.index || granter.slot === to) return ability;
    const moved = { ...ability, [granter.slot]: null };
    return moved[to] ? moved : { ...moved, [to]: item.ref };
  });
  return {
    ...draft,
    abilities,
    items: draft.items.map((it, i) => (i === index ? { ...it, type } : it)),
  };
}

/** The draft without item `index` and without any grant of it. */
export function removeItem(draft: ClassDraft, index: number): ClassDraft {
  const ref = draft.items[index].ref;
  return {
    ...draft,
    items: draft.items.filter((_, i) => i !== index),
    abilities: draft.abilities.map((a) => ({
      ...a,
      grantItem: a.grantItem === ref ? null : a.grantItem,
      grantPet: a.grantPet === ref ? null : a.grantPet,
    })),
  };
}

/** The item card a draft path points into, e.g. `items.2.name.en` → 2. */
export function itemIndexOf(path: string): number | null {
  const match = /^items\.(\d+)\./.exec(path);
  return match ? Number(match[1]) : null;
}
