import { DiePicker } from "@/components/atoms/DiePicker/DiePicker";
import { NumberStepper } from "@/components/atoms/NumberStepper/NumberStepper";
import { SegmentedChoice } from "@/components/atoms/SegmentedChoice/SegmentedChoice";
import { signed } from "@/utils/signed";
import { useTranslation } from "react-i18next";
import { fieldId, formulaText, statRange } from "../classCreator.utils";
import type { StatLineProps } from "./StatLine.models";
import { Formula } from "../classCreator.styles";
import { Controls, Line, Range, Result, StatName } from "./StatLine.styles";

/** One stat on one line: dice, sides, modifier, lowest die, and its result stamped in book notation. */
export function StatLine({ stat, dice, onChange }: StatLineProps) {
  const { t } = useTranslation();
  const short = t(`creator.stats.short.${stat}`);
  const range = statRange(dice);
  const path = `stats.${stat}`;

  return (
    <Line aria-label={t("creator.stats.lineLabel", "{{stat}} dice", { stat: short })}>
      <StatName className={stat} aria-hidden="true">
        {short}
      </StatName>
      <Controls>
        <NumberStepper
          id={fieldId(`${path}.count`)}
          label={t("creator.stats.dice", "Dice")}
          value={dice.count}
          min={1}
          max={6}
          onChange={(count) => onChange({ ...dice, count, dropLowest: count > 1 && dice.dropLowest })}
        />
        <DiePicker
          id={fieldId(`${path}.faces`)}
          label={t("creator.stats.sides", "Sides")}
          value={dice.faces}
          options={[4, 6, 8, 10, 12]}
          onChange={(faces) => onChange({ ...dice, faces })}
        />
        <NumberStepper
          id={fieldId(`${path}.modifier`)}
          label={t("creator.stats.modifier", "Modifier")}
          value={dice.modifier}
          min={-6}
          max={6}
          signedValue
          onChange={(modifier) => onChange({ ...dice, modifier })}
        />
        <SegmentedChoice<"kept" | "dropped">
          id={fieldId(`${path}.dropLowest`)}
          label={t("creator.stats.lowestDie", "Lowest die")}
          value={dice.dropLowest ? "dropped" : "kept"}
          options={[
            { value: "kept", label: t("creator.stats.kept", "Kept") },
            {
              value: "dropped",
              label: t("creator.stats.dropped", "Dropped"),
              disabledReason:
                dice.count < 2
                  ? t("creator.stats.dropNeedsTwo", "Dropping the lowest die needs at least two dice.")
                  : undefined,
            },
          ]}
          onChange={(next) => onChange({ ...dice, dropLowest: next === "dropped" })}
        />
      </Controls>
      <Result aria-live="polite">
        <Formula>{formulaText(dice)}</Formula>
        <Range>
          <span>{t("creator.stats.scoreRange", "score {{low}}–{{high}}", { low: range.low, high: range.high })}</span>
          <span>
            {t("creator.stats.modRange", "mod {{low}} to {{high}}", {
              low: signed(range.modLow),
              high: signed(range.modHigh),
            })}
          </span>
        </Range>
      </Result>
    </Line>
  );
}
