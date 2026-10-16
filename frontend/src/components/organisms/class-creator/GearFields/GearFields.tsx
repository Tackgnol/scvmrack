import { DiePicker } from "@/components/atoms/DiePicker/DiePicker";
import { NumberStepper } from "@/components/atoms/NumberStepper/NumberStepper";
import { SegmentedChoice } from "@/components/atoms/SegmentedChoice/SegmentedChoice";
import { useTranslation } from "react-i18next";
import type { ItemFieldsProps } from "../creatorShared.models";
import { Controls } from "../creatorShared.styles";
import { fieldId } from "../creatorShared.utils";
import { DIE_FACES } from "@/utils/rollDie";

/** Gear: consumable, wearable or carried; how many uses; what using it does. */
export function GearFields({ path, item, onChange }: ItemFieldsProps<"gear">) {
  const { t } = useTranslation();
  const g = item.gear;
  const base = `${path}.gear`;
  return (
    <Controls>
      <SegmentedChoice<"consumable" | "wearable" | "carried">
        id={fieldId(`${base}.kind`)}
        label={t("creator.items.kind", "Kind")}
        value={g.kind}
        options={[
          { value: "consumable", label: t("creator.items.consumable", "Consumable") },
          { value: "wearable", label: t("creator.items.wearable", "Wearable") },
          { value: "carried", label: t("creator.items.carried", "Carried") },
        ]}
        onChange={(kind) => onChange({ ...g, kind })}
      />
      <NumberStepper
        id={fieldId(`${base}.uses`)}
        label={t("creator.items.uses", "Uses")}
        value={g.uses}
        min={0}
        max={99}
        onChange={(uses) => onChange({ ...g, uses })}
      />
      <SegmentedChoice<"text" | "damage" | "die">
        id={fieldId(`${base}.effect`)}
        label={t("creator.items.onUse", "On use")}
        value={g.effect}
        options={[
          { value: "text", label: t("creator.items.effectText", "Text only") },
          { value: "damage", label: t("creator.items.effectDamage", "Deals damage") },
          { value: "die", label: t("creator.items.effectDie", "Effect die") },
        ]}
        onChange={(effect) => onChange({ ...g, effect })}
      />
      {g.effect !== "text" && (
        <DiePicker
          id={fieldId(`${base}.effectDie`)}
          label={
            g.effect === "damage"
              ? t("creator.items.damageDie", "Damage die")
              : t("creator.items.effectDieLabel", "Effect die")
          }
          value={g.effectDie}
          options={DIE_FACES}
          onChange={(effectDie) => onChange({ ...g, effectDie })}
        />
      )}
    </Controls>
  );
}
