import type { Control } from "react-hook-form";
import type { EnemyFormInput, EnemyFormValues } from "./enemyForm";

export type EnemyPairListName = "attacks" | "specials" | "loot";

export type EnemyPairRowsSectionProps<N extends EnemyPairListName> = {
  control: Control<EnemyFormInput, unknown, EnemyFormValues>;
  name: N;
  fieldKeys: readonly [
    Exclude<keyof EnemyFormInput[N][number], "id">,
    Exclude<keyof EnemyFormInput[N][number], "id">,
  ];
  fieldLabels: readonly [string, string];
  title: string;
  addLabel: string;
  removeLabel: string;
  createEmpty: () => EnemyFormInput[N][number];
};
