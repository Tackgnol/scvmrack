import { SegmentedChoice } from "@/components/atoms/SegmentedChoice/SegmentedChoice";
import { LocalizedField } from "@/components/molecules/LocalizedField/LocalizedField";
import { Trans, useTranslation } from "react-i18next";
import type { StepProps } from "../classCreator.models";
import type { LanguageChoice } from "./IdentityStep.models";
import { Hint, Stack, ZineContact } from "../classCreator.styles";
import { fieldId, LIMIT_NAME, LIMIT_TEXT } from "../classCreator.utils";

/** Step 1: which languages the class is written in, its name and its description. */
export function IdentityStep({ draft, language, update, showMissing, touch }: StepProps) {
  const { t } = useTranslation();
  const choice: LanguageChoice = draft.languages.length > 1 ? "both" : draft.languages[0];
  const namePath = `name.${language}`;
  const descriptionPath = `description.${language}`;

  return (
    <Stack>
      <SegmentedChoice<LanguageChoice>
        id={fieldId("languages")}
        label={t("creator.identity.languages", "Languages this class is written in")}
        value={choice}
        options={[
          { value: "en", label: t("creator.identity.englishOnly", "English only") },
          { value: "pl", label: t("creator.identity.polishOnly", "Polish only") },
          { value: "both", label: t("creator.identity.both", "Both") },
        ]}
        onChange={(next) =>
          update((d) => ({ ...d, languages: next === "both" ? ["en", "pl"] : [next] }))
        }
      />
      <Hint>
        {choice === "both"
          ? t(
              "creator.identity.bothHint",
              "Every text field needs both languages. Players see their own. “Writing in” at the top only switches which one you are editing.",
            )
          : t(
              "creator.identity.oneHint",
              "Players in either language see the {{language}} text. Text you wrote in the other language is kept, only hidden.",
              { language: t(`creator.languageNames.${choice}`) },
            )}
      </Hint>
      <LocalizedField
        id={fieldId(namePath)}
        label={t("creator.identity.name", "Class name")}
        required
        value={draft.name[language]}
        language={language}
        showMissing={showMissing(namePath)}
        maxLength={LIMIT_NAME}
        onChange={(value) => update((d) => ({ ...d, name: { ...d.name, [language]: value } }))}
        onBlur={() => touch(namePath)}
      />
      <LocalizedField
        id={fieldId(descriptionPath)}
        label={t("creator.identity.description", "Description")}
        required
        value={draft.description[language]}
        language={language}
        multiline
        showMissing={showMissing(descriptionPath)}
        maxLength={LIMIT_TEXT}
        onChange={(value) =>
          update((d) => ({ ...d, description: { ...d.description, [language]: value } }))
        }
        onBlur={() => touch(descriptionPath)}
      />
      <ZineContact>
        <Trans
          i18nKey="creator.zineContact"
          defaults="Zine author? Want to add your class to the roster? <mail>Get in touch (contact@rpgtools.co)</mail>"
          components={{ mail: <a href="mailto:contact@rpgtools.co" /> }}
        />
      </ZineContact>
    </Stack>
  );
}
