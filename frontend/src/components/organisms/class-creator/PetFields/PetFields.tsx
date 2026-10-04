import { DiePicker } from "@/components/atoms/DiePicker/DiePicker";
import { NumberStepper } from "@/components/atoms/NumberStepper/NumberStepper";
import { SegmentedChoice } from "@/components/atoms/SegmentedChoice/SegmentedChoice";
import { useTranslation } from "react-i18next";
import type { ItemFieldsProps } from "../classCreator.models";
import { Controls } from "../classCreator.styles";
import { fieldId } from "../classCreator.utils";

/** A pet's HP, action die, whether it attacks or buffs allies, and whether it is a beast or humanoid. */
export function PetFields({ path, item, onChange }: ItemFieldsProps<"pet">) {
  const { t } = useTranslation();
  const p = item.pet;
  const base = `${path}.pet`;
  return (
    <Controls>
      <NumberStepper
        id={fieldId(`${base}.hp`)}
        label={t("creator.items.hp", "HP")}
        value={p.hp}
        min={1}
        max={99}
        onChange={(hp) => onChange({ ...p, hp })}
      />
      <DiePicker
        id={fieldId(`${base}.actionDie`)}
        label={t("creator.items.actionDie", "Action die")}
        value={p.actionDie}
        options={[2, 4, 6, 8, 10]}
        onChange={(actionDie) => onChange({ ...p, actionDie })}
      />
      <SegmentedChoice<"attack" | "buff">
        id={fieldId(`${base}.action`)}
        label={t("creator.items.action", "Action")}
        value={p.action}
        options={[
          { value: "attack", label: t("creator.items.attacks", "Attacks") },
          { value: "buff", label: t("creator.items.buffs", "Buffs allies") },
        ]}
        onChange={(action) => onChange({ ...p, action })}
      />
      <SegmentedChoice<"beast" | "humanoid">
        id={fieldId(`${base}.humanoid`)}
        label={t("creator.items.kind", "Kind")}
        value={p.humanoid ? "humanoid" : "beast"}
        options={[
          { value: "beast", label: t("creator.items.beast", "Beast") },
          { value: "humanoid", label: t("creator.items.humanoid", "Humanoid") },
        ]}
        onChange={(kind) => onChange({ ...p, humanoid: kind === "humanoid" })}
      />
    </Controls>
  );
}
