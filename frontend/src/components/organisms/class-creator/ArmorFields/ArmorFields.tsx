import { SegmentedChoice } from "@/components/atoms/SegmentedChoice/SegmentedChoice";
import { useTranslation } from "react-i18next";
import type { ItemFieldsProps } from "../classCreator.models";
import { Controls } from "../classCreator.styles";
import { fieldId } from "../classCreator.utils";

/** An armor's tier: 1 light (d2), 2 medium (d4), 3 heavy (d6). */
export function ArmorFields({ path, item, onChange }: ItemFieldsProps<"armor">) {
  const { t } = useTranslation();
  return (
    <Controls>
      <SegmentedChoice<"1" | "2" | "3">
        id={fieldId(`${path}.armor.tier`)}
        label={t("creator.items.tier", "Armor tier")}
        value={String(item.armor.tier) as "1" | "2" | "3"}
        options={(["1", "2", "3"] as const).map((tier) => ({
          value: tier,
          label: t("creator.items.tierN", "Tier {{n}}", { n: tier }),
        }))}
        onChange={(tier) => onChange({ ...item.armor, tier: Number(tier) })}
      />
    </Controls>
  );
}
