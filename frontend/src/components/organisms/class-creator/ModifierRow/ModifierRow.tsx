import type { ClassStat } from "@/api/classes";
import { NumberStepper } from "@/components/atoms/NumberStepper/NumberStepper";
import { SegmentedChoice } from "@/components/atoms/SegmentedChoice/SegmentedChoice";
import { scopeIncludeOptions, statOptions } from "@/components/modifiers/config";
import type { ScopeOption } from "@/components/modifiers/types";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { GroupHeading, SmallAction, Spread } from "../classCreator.styles";
import { fieldId, modifierScope, scopeExclude } from "../classCreator.utils";
import type { ModifierRowProps } from "./ModifierRow.models";
import { Controls, Row } from "./ModifierRow.styles";

/** One modifier an ability carries: the stat, the value, and which rolls it applies to. */
export function ModifierRow({ path, index, modifier, onChange, onRemove }: ModifierRowProps) {
  const { t } = useTranslation();
  const scope = modifierScope(modifier);
  const [showMore, setShowMore] = useState(() => scopeIncludeOptions.some((o) => o.more && o.value === scope));
  // The chosen scope stays listed, so the radio group always has a focusable choice.
  const scopes = scopeIncludeOptions.filter((option) => showMore || !option.more || option.value === scope);

  return (
    <Row>
      <Spread>
        <GroupHeading>{t("creator.abilities.modifierN", "Modifier {{n}}", { n: index + 1 })}</GroupHeading>
        <SmallAction type="button" className="kill" onClick={onRemove}>
          {t("creator.remove", "Remove")}
        </SmallAction>
      </Spread>
      <Controls>
        <SegmentedChoice<ClassStat>
          id={fieldId(`${path}.statistic`)}
          label={t("creator.abilities.stat", "Stat")}
          value={modifier.statistic}
          options={statOptions.map((option) => ({ value: option.value, label: option.label }))}
          onChange={(statistic) => onChange({ ...modifier, statistic })}
        />
        <NumberStepper
          id={fieldId(`${path}.value`)}
          label={t("creator.abilities.value", "Value")}
          value={modifier.value}
          min={-10}
          max={10}
          signedValue
          onChange={(value) => onChange({ ...modifier, value })}
        />
        <SegmentedChoice<ScopeOption>
          id={fieldId(`${path}.scope`)}
          label={t("creator.abilities.appliesTo", "Applies to")}
          value={scope}
          options={scopes.map((option) => ({ value: option.value, label: t(option.labelKey) }))}
          onChange={(next) => onChange({ ...modifier, exclude: scopeExclude(next) })}
        />
        <SmallAction type="button" aria-expanded={showMore} onClick={() => setShowMore((open) => !open)}>
          {showMore ? t("modifiers.fewer", "Fewer") : t("modifiers.more", "More")}
        </SmallAction>
      </Controls>
    </Row>
  );
}
