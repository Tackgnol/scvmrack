import { ABILITY_STATS, statToModifier } from "@/utils/stats";
import { signed } from "@/utils/signed";
import { useTranslation } from "react-i18next";
import { Interrupt } from "../classCreator.styles";
import { gearCounts, namedCounts } from "./TestRollSheet.utils";
import type { TestRollSheetProps } from "./TestRollSheet.models";
import { Chip, Chips, Micro, Muted, Origin, Sheet, SmallTitle, StatBox, StatRow } from "./TestRollSheet.styles";

/** The scvm a test roll produced: stats, resources, starting gear and origin. */
export function TestRollSheet({ scvm, className, stale, quiet }: TestRollSheetProps) {
  const { t } = useTranslation();
  const gear = gearCounts(scvm);
  const abilities = namedCounts((scvm.abilities ?? []).map((ability) => ability.name));

  return (
    <Sheet data-testid="test-roll-sheet">
      <Micro>{t("creator.review.testScvm", "Test scvm · {{name}}", { name: className })}</Micro>
      {stale && (
        <Interrupt className={quiet ? "quiet" : undefined}>{t("creator.review.stale", "The draft changed since this roll. Roll again to see it.")}</Interrupt>
      )}
      <h3>{scvm.name}</h3>
      <StatRow>
        {ABILITY_STATS.map((stat) => (
          <StatBox key={stat}>
            <b>{signed(statToModifier(scvm[stat]))}</b>
            <span>
              {t(`creator.stats.short.${stat}`)} {scvm[stat]}
            </span>
          </StatBox>
        ))}
      </StatRow>
      <Chips>
        <Chip className="hp">{t("creator.review.hp", "HP {{hp}}", { hp: scvm.maxHp })}</Chip>
        <Chip>{t("creator.review.omens", "Omens {{omens}}", { omens: scvm.omens })}</Chip>
        <Chip>{t("creator.review.silver", "{{silver}} silver", { silver: scvm.silver })}</Chip>
      </Chips>
      <SmallTitle>{t("creator.steps.abilities.label", "Abilities")}</SmallTitle>
      <ul>
        {abilities.length === 0 && (
          <li>
            <Muted>{t("creator.review.none", "Nothing")}</Muted>
          </li>
        )}
        {abilities.map(([name, count]) => (
          <li key={name}>{count > 1 ? `${name} ×${count}` : name}</li>
        ))}
      </ul>
      <SmallTitle>{t("creator.review.gear", "Starts with")}</SmallTitle>
      <ul>
        {gear.length === 0 && (
          <li>
            <Muted>{t("creator.review.none", "Nothing")}</Muted>
          </li>
        )}
        {gear.map(([name, count]) => (
          <li key={name}>{count > 1 ? `${name} ×${count}` : name}</li>
        ))}
      </ul>
      <SmallTitle>{t("creator.review.origin", "Origin")}</SmallTitle>
      <Origin>{scvm.origin || <Muted>{t("creator.review.none", "Nothing")}</Muted>}</Origin>
    </Sheet>
  );
}
