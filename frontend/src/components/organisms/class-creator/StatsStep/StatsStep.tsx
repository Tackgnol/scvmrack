import { DiePicker } from "@/components/atoms/DiePicker/DiePicker";
import { NumberStepper } from "@/components/atoms/NumberStepper/NumberStepper";
import { ABILITY_STATS } from "@/utils/stats";
import { useTranslation } from "react-i18next";
import { StatLine } from "../StatLine/StatLine";
import type { StepProps } from "../classCreator.models";
import { Stack } from "../classCreator.styles";
import { fieldId } from "../classCreator.utils";
import { DiceGrid } from "./StatsStep.styles";

/** Step 2: how each stat is rolled, plus HP, omens, starting gear dice and silver. */
export function StatsStep({ draft, update }: Pick<StepProps, "draft" | "update">) {
  const { t } = useTranslation();
  return (
    <Stack>
      {ABILITY_STATS.map((stat) => (
        <StatLine
          key={stat}
          stat={stat}
          dice={draft.stats[stat]}
          onChange={(dice) => update((d) => ({ ...d, stats: { ...d.stats, [stat]: dice } }))}
        />
      ))}
      <DiceGrid>
        <DiePicker
          id={fieldId("hpDie")}
          label={t("creator.stats.hpDie", "HP die (+ TOU)")}
          value={draft.hpDie}
          options={[2, 4, 6, 8, 10, 12]}
          hint={t("creator.stats.hpHint", "Starting HP is this die plus Toughness, at least 1. Book classes use d4 to d10.")}
          onChange={(hpDie) => update((d) => ({ ...d, hpDie }))}
        />
        <DiePicker
          id={fieldId("omenDie")}
          label={t("creator.stats.omenDie", "Omen die")}
          value={draft.omenDie}
          options={[2, 4, 6]}
          hint={t("creator.stats.omenHint", "Omens the scvm starts with. Book classes use d2 or d4.")}
          onChange={(omenDie) => update((d) => ({ ...d, omenDie }))}
        />
        <DiePicker
          id={fieldId("weaponDie")}
          label={t("creator.stats.weaponDie", "Starting weapon die")}
          value={draft.weaponDie}
          options={[4, 6, 8, 10]}
          hint={t("creator.stats.weaponHint", "Rolls on the book’s starting weapon table (d10: femur to zweihänder).")}
          onChange={(weaponDie) => update((d) => ({ ...d, weaponDie }))}
        />
        <DiePicker
          id={fieldId("armorDie")}
          label={t("creator.stats.armorDie", "Starting armor die")}
          value={draft.armorDie}
          options={[2, 3, 4]}
          hint={t("creator.stats.armorHint", "Rolls on the book’s starting armor table (d4: none to heavy armor).")}
          onChange={(armorDie) => update((d) => ({ ...d, armorDie }))}
        />
      </DiceGrid>
      <DiceGrid>
        <NumberStepper
          id={fieldId("silver.count")}
          label={t("creator.stats.silverDice", "Silver dice")}
          value={draft.silver.count}
          min={1}
          max={6}
          onChange={(count) => update((d) => ({ ...d, silver: { ...d.silver, count } }))}
        />
        <DiePicker
          id={fieldId("silver.faces")}
          label={t("creator.stats.silverSides", "Silver sides")}
          value={draft.silver.faces}
          options={[4, 6]}
          onChange={(faces) => update((d) => ({ ...d, silver: { ...d.silver, faces } }))}
        />
        <NumberStepper
          id={fieldId("silver.multiplier")}
          label={t("creator.stats.silverMultiplier", "Silver multiplier")}
          value={draft.silver.multiplier}
          min={1}
          max={100}
          hint={t("creator.stats.silverHint", "Silver is the dice total times this. The book default is 2d6 × 10.")}
          onChange={(multiplier) => update((d) => ({ ...d, silver: { ...d.silver, multiplier } }))}
        />
      </DiceGrid>
    </Stack>
  );
}
