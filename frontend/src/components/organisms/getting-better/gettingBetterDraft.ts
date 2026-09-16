import type {
  AbilityStat,
  ImprovementDebrisRoll,
  ImprovementDraft,
  RollValue,
} from "@/api/characterImprovementTypes";
import { modifierToCanonicalScore, statToModifier } from "@/utils/stats";

export const SCROLL_ROLLS = Array.from({ length: 10 }, (_, index) => index + 1);

export function tableRoll(total: number): RollValue {
  return { source: "table", total };
}

export function numberValue(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function deriveAbility(
  current: ImprovementDraft["abilities"][AbilityStat],
  rollTotal: number,
) {
  const fromModifier = statToModifier(current.fromScore);
  const boundedRoll = Math.max(1, Math.min(6, rollTotal));
  const nextModifier =
    fromModifier <= 1
      ? boundedRoll === 1
        ? Math.max(-3, fromModifier - 1)
        : Math.min(6, fromModifier + 1)
      : boundedRoll >= fromModifier
        ? Math.min(6, fromModifier + 1)
        : Math.max(-3, fromModifier - 1);

  return {
    ...current,
    roll: tableRoll(boundedRoll),
    fromModifier,
    toModifier: nextModifier,
    toScore: modifierToCanonicalScore(nextModifier),
    outcome:
      nextModifier > fromModifier
        ? "increase"
        : nextModifier < fromModifier
          ? "decrease"
          : "same",
  } as const;
}

export function deriveHp(
  hp: ImprovementDraft["hp"],
  checkTotal: number,
  increaseTotal = hp.increase?.total ?? 1,
): ImprovementDraft["hp"] {
  const succeeds = checkTotal >= hp.fromMaxHp;
  const increase = succeeds ? tableRoll(increaseTotal) : null;
  return {
    ...hp,
    check: tableRoll(checkTotal),
    succeeds,
    increase,
    toMaxHp: succeeds ? hp.fromMaxHp + (increase?.total ?? 0) : hp.fromMaxHp,
  };
}

export function scrollKey(kind: "sacred" | "unclean", roll: number): string {
  return `scroll.${kind}.${Math.max(1, Math.min(10, roll))}`;
}

export function deriveDebris(
  debris: ImprovementDebrisRoll,
  rollTotal: number,
): ImprovementDebrisRoll {
  const roll = tableRoll(rollTotal);
  if (rollTotal <= 3) return { roll, kind: "nothing" };

  if (rollTotal === 4) {
    const silver =
      debris.kind === "silver"
        ? debris.silver
        : { source: "table" as const, total: 3 };
    return { roll, kind: "silver", silver, amount: silver.total };
  }

  if (rollTotal === 5) {
    const scroll =
      debris.kind === "uncleanScroll"
        ? debris.scroll
        : { source: "table" as const, total: 1 };
    return {
      roll,
      kind: "uncleanScroll",
      scroll,
      itemKey: scrollKey("unclean", scroll.total),
    };
  }

  const scroll =
    debris.kind === "sacredScroll"
      ? debris.scroll
      : { source: "table" as const, total: 1 };
  return {
    roll,
    kind: "sacredScroll",
    scroll,
    itemKey: scrollKey("sacred", scroll.total),
  };
}
