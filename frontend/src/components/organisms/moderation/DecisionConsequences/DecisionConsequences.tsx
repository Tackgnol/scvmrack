import { useTranslation } from "react-i18next";
import type { DecisionConsequencesProps } from "./DecisionConsequences.models";
import { Consequences } from "./DecisionConsequences.styles";

/** What each decision on an open report does, read before acting. */
export function DecisionConsequences({ id, builtIn }: DecisionConsequencesProps) {
  const { t } = useTranslation();
  return (
    <Consequences id={id}>
      <li>
        <strong>{t("moderation.dismiss", "Dismiss")}</strong>:{" "}
        {t("moderation.dismissEffect", "the class stays public and this report closes.")}
      </li>
      <li>
        <strong>{builtIn ? t("moderation.hide", "Hide") : t("moderation.takeDown", "Take down")}</strong>:{" "}
        {t(
          "moderation.takeDownEffect",
          "hidden from search, pickers and party pools; no new characters. Existing characters keep it.",
        )}
      </li>
      {!builtIn && (
        <li>
          <strong>{t("moderation.removeContent", "Remove content")}</strong>:{" "}
          {t(
            "moderation.removeContentEffect",
            "its text becomes \u201c[removed by moderation]\u201d everywhere, including existing characters.",
          )}
        </li>
      )}
    </Consequences>
  );
}
