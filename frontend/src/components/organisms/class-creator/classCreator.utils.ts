import type { ClassDraft, ClassLanguage, Localized, StatDice } from "@/api/classes";
import { signed } from "@/utils/signed";
import { statToModifier } from "@/utils/stats";
import type { CreatorIssue, CreatorStep } from "./classCreator.models";

export const LIMIT_LIST = 20;
export const LIMIT_TEXT = 1500;
export const LIMIT_NAME = 100;

/** The creator's steps in order; Class Items and Abilities join with their own tickets. */
export const STEPS: CreatorStep[] = ["identity", "stats", "origins", "gettingBetter", "review"];

const empty = (): Localized => ({ en: "", pl: "" });
const bookStat = (): StatDice => ({ count: 3, faces: 6, modifier: 0, dropLowest: false });

/** A new class: the book's defaults and no text yet. */
export function blankDraft(): ClassDraft {
  return {
    languages: ["en"],
    name: empty(),
    description: empty(),
    stats: { strength: bookStat(), agility: bookStat(), presence: bookStat(), toughness: bookStat() },
    hpDie: 8,
    omenDie: 2,
    weaponDie: 10,
    armorDie: 4,
    silver: { count: 2, faces: 6, multiplier: 10 },
    origins: [],
    gettingBetterRule: "book",
    gettingBetterNote: empty(),
  };
}

/** How a stat is rolled, in book notation: `3d6 −1`, `best 3 of 4d6`. */
export function formulaText(stat: StatDice): string {
  const mod = stat.modifier ? ` ${signed(stat.modifier)}` : "";
  const dice = `${stat.count}d${stat.faces}`;
  return stat.dropLowest && stat.count > 1 ? `best ${stat.count - 1} of ${dice}${mod}` : `${dice}${mod}`;
}

/** The lowest and highest score a stat can roll, and their modifiers. */
export function statRange(stat: StatDice) {
  const kept = stat.dropLowest && stat.count > 1 ? stat.count - 1 : stat.count;
  const low = kept + stat.modifier;
  const high = kept * stat.faces + stat.modifier;
  return { low, high, modLow: statToModifier(low), modHigh: statToModifier(high) };
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
        issues.push({ key, params: { ...params, language }, step, language, path: `${base}.${language}` });
      }
    }
  };
  text(draft.name, "name", "identity", "creator.issues.missingName");
  text(draft.description, "description", "identity", "creator.issues.missingDescription");
  draft.origins.forEach((origin, i) =>
    text(origin, `origins.${i}`, "origins", "creator.issues.missingOrigin", { n: i + 1 }),
  );
  if (draft.origins.length === 0) {
    issues.push({ key: "creator.issues.noOrigin", params: {}, step: "origins", path: "origins.add" });
  }
  // The random pool arrives with the Abilities step (RPG-268); until then it is empty.
  if (draft.gettingBetterRule === "specialist") {
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
  const target = document.getElementById(path === null ? STEP_TITLE_ID : fieldId(path));
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
  return issues.filter((i) => i.language === language && (!step || i.step === step)).length;
}
