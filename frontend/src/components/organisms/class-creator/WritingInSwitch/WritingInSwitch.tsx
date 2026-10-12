import { moveInRadioGroup } from "@/utils/radioGroupKeys";
import { useTranslation } from "react-i18next";
import { missingCount } from "../classCreator.utils";
import type { WritingInSwitchProps } from "./WritingInSwitch.models";
import { Caption, Option, Wrap } from "./WritingInSwitch.styles";

/** "Writing in English / Polish": which language the fields edit, with what each still misses. */
export function WritingInSwitch({ languages, value, step, issues, quiet, onChange }: WritingInSwitchProps) {
  const { t } = useTranslation();
  if (languages.length < 2) {
    return <Caption>{t(`creator.onlyLanguage.${languages[0]}`)}</Caption>;
  }
  return (
    <Wrap>
      <Caption id="writing-in">{t("creator.writingIn", "Writing in")}</Caption>
      <Wrap
        role="radiogroup"
        aria-labelledby="writing-in"
        onKeyDown={(event) => {
          const index = moveInRadioGroup(event);
          if (index !== null) {
            onChange(languages[index]);
          }
        }}
      >
        {languages.map((language) => {
          const missing = missingCount(issues, language, step === "review" ? undefined : step);
          return (
            <Option
              key={language}
              type="button"
              role="radio"
              aria-checked={language === value}
              tabIndex={language === value ? 0 : -1}
              onClick={() => onChange(language)}
            >
              {t(`creator.languageNames.${language}`)}
              {missing > 0 && (
                <span className={quiet ? "missing quiet" : "missing"}>
                  {t("creator.missingCount", "{{count}} missing", { count: missing })}
                </span>
              )}
            </Option>
          );
        })}
      </Wrap>
    </Wrap>
  );
}
