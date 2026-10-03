import type { ClassStat, StatDice } from "@/api/classes";

export type StatLineProps = {
  stat: ClassStat;
  dice: StatDice;
  onChange: (dice: StatDice) => void;
};
