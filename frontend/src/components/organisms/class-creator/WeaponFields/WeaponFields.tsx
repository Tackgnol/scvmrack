import { DiePicker } from "@/components/atoms/DiePicker/DiePicker";
import { NumberStepper } from "@/components/atoms/NumberStepper/NumberStepper";
import { SegmentedChoice } from "@/components/atoms/SegmentedChoice/SegmentedChoice";
import { LocalizedField } from "@/components/molecules/LocalizedField/LocalizedField";
import { useTranslation } from "react-i18next";
import { Controls } from "../creatorShared.styles";
import { fieldId } from "../creatorShared.utils";
import { DIE_FACES } from "@/utils/rollDie";
import type { ItemFieldsProps } from "../creatorShared.models";

/** A weapon's damage, reach and ammo. */
export function WeaponFields({ path, item, language, onChange }: ItemFieldsProps<"weapon">) {
  const { t } = useTranslation();
  const w = item.weapon;
  const base = `${path}.weapon`;
  return (
    <Controls>
      <NumberStepper
        id={fieldId(`${base}.diceCount`)}
        label={t("creator.items.damageDice", "Damage dice")}
        value={w.diceCount}
        min={1}
        max={6}
        onChange={(diceCount) => onChange({ ...w, diceCount })}
      />
      <DiePicker
        id={fieldId(`${base}.diceFaces`)}
        label={t("creator.stats.sides", "Sides")}
        value={w.diceFaces}
        options={DIE_FACES}
        onChange={(diceFaces) => onChange({ ...w, diceFaces })}
      />
      <NumberStepper
        id={fieldId(`${base}.damageModifier`)}
        label={t("creator.stats.modifier", "Modifier")}
        value={w.damageModifier}
        min={-6}
        max={6}
        signedValue
        onChange={(damageModifier) => onChange({ ...w, damageModifier })}
      />
      <SegmentedChoice<"melee" | "ranged">
        id={fieldId(`${base}.reach`)}
        label={t("creator.items.reach", "Reach")}
        value={w.reach}
        options={[
          { value: "melee", label: t("creator.items.melee", "Melee") },
          { value: "ranged", label: t("creator.items.ranged", "Ranged") },
        ]}
        onChange={(reach) => onChange({ ...w, reach })}
      />
      {w.reach === "ranged" && (
        <SegmentedChoice<"none" | "counted" | "endless">
          id={fieldId(`${base}.ammo`)}
          label={t("creator.items.ammo", "Ammo")}
          value={w.ammo}
          options={[
            { value: "none", label: t("creator.items.ammoNone", "None") },
            { value: "counted", label: t("creator.items.ammoCounted", "Counted") },
            { value: "endless", label: t("creator.items.ammoEndless", "Endless") },
          ]}
          onChange={(ammo) => onChange({ ...w, ammo })}
        />
      )}
      {w.reach === "ranged" && w.ammo === "counted" && (
        <>
          <NumberStepper
            id={fieldId(`${base}.ammoCount`)}
            label={t("creator.items.ammoCount", "Starting ammo")}
            value={w.ammoCount}
            min={1}
            max={99}
            onChange={(ammoCount) => onChange({ ...w, ammoCount })}
          />
          <LocalizedField
            id={fieldId(`${base}.ammoName`)}
            label={t("creator.items.ammoName", "Ammo name (optional)")}
            value={w.ammoName}
            language={language}
            showMissing={false}
            maxLength={50}
            onChange={(ammoName) => onChange({ ...w, ammoName })}
            onBlur={() => {}}
          />
        </>
      )}
    </Controls>
  );
}
