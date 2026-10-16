import type { ClassStat, StatDice } from "@/api/classes";

export type StatLineProps = {
  stat: ClassStat;
  dice: StatDice;
  open: boolean;
  onToggle: () => void;
  onChange: (dice: StatDice) => void;
};
