import { useTranslation } from "react-i18next";
import type { AbilitySummaryProps } from "./AbilitySummary.models";
import { Chip, Chips, Edit, Kind, Name, Summary } from "../classCreator.styles";
import { modifierChip } from "./AbilitySummary.utils";

/** A closed ability card: Fixed or Random N, its name, what it carries, what it still misses, and Edit. */
export function AbilitySummary({ id, transitionName, ability, language, randomNumber, missing, onOpen }: AbilitySummaryProps) {
  const { t } = useTranslation();
  const name = ability.name[language];

  return (
    <Summary id={id} type="button" aria-expanded={false} onClick={onOpen} style={{ viewTransitionName: transitionName }}>
      <Kind className={randomNumber === null ? "fixed" : undefined}>
        {randomNumber === null
          ? t("creator.abilities.fixed", "Fixed")
          : t("creator.abilities.randomN", "Random {{n}}", { n: randomNumber })}
      </Kind>
      <Name className={name ? undefined : "untitled"}>{name || t("creator.abilities.untitled", "Unnamed ability")}</Name>
      <Edit>{t("creator.abilities.edit", "Edit")}</Edit>
      <Chips>
        {[...new Set(ability.modifiers.map((modifier) => modifierChip(t, modifier)))].map((chip) => (
          <Chip key={chip}>{chip}</Chip>
        ))}
        {missing > 0 && (
          <Chip className="missing">{t("creator.missingCount", "{{count}} missing", { count: missing })}</Chip>
        )}
      </Chips>
    </Summary>
  );
}
