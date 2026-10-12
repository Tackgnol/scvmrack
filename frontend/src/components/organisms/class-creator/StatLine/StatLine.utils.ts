import type { StatDice } from "@/api/classes";

/** True when a stat rolls exactly like most book classes: 3d6, no modifier, every die kept. */
export function isBookDefault(dice: StatDice): boolean {
  return dice.count === 3 && dice.faces === 6 && dice.modifier === 0 && !dice.dropLowest;
}
