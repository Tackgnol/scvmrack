import type { GettingBetterRule } from "@/api/classPool";
import { SegmentedChoice } from "@/components/atoms/SegmentedChoice/SegmentedChoice";
import { LocalizedField } from "@/components/molecules/LocalizedField/LocalizedField";
import { useTranslation } from "react-i18next";
import type { StepProps } from "../classCreator.models";
import { Hint, Interrupt, Stack } from "../classCreator.styles";
import { fieldId, LIMIT_TEXT } from "../classCreator.utils";

/** Step 4: what happens when a scvm of this class gets better, and a note for the player. */
export function GettingBetterStep({ draft, language, update, touch }: StepProps) {
  const { t } = useTranslation();
  const notePath = `gettingBetterNote.${language}`;
  // The random pool arrives with the Abilities step (RPG-268); until then it is empty.
  const poolTooSmall = t(
    "creator.gettingBetter.specialistDisabled",
    "Specialist needs a random ability pool with at least one more ability than each scvm rolls. Add random abilities first.",
  );

  return (
    <Stack>
      <SegmentedChoice<GettingBetterRule>
        id={fieldId("gettingBetterRule")}
        label={t("creator.gettingBetter.rule", "Rule")}
        value={draft.gettingBetterRule}
        options={[
          { value: "book", label: t("classPool.rules.book") },
          { value: "book_plus_ability", label: t("classPool.rules.book_plus_ability") },
          { value: "specialist", label: t("classPool.rules.specialist"), disabledReason: poolTooSmall },
        ]}
        onChange={(gettingBetterRule) => update((d) => ({ ...d, gettingBetterRule }))}
      />
      <Hint>{t(`creator.gettingBetter.explain.${draft.gettingBetterRule}`)}</Hint>
      {draft.gettingBetterRule === "specialist" && <Interrupt>{poolTooSmall}</Interrupt>}
      <LocalizedField
        id={fieldId(notePath)}
        label={t("creator.gettingBetter.note", "Rules note for the player (optional)")}
        value={draft.gettingBetterNote[language]}
        language={language}
        multiline
        showMissing={false}
        maxLength={LIMIT_TEXT}
        onChange={(value) =>
          update((d) => ({ ...d, gettingBetterNote: { ...d.gettingBetterNote, [language]: value } }))
        }
        onBlur={() => touch(notePath)}
      />
    </Stack>
  );
}
