import { useTranslation } from "react-i18next";
import type { IssueListProps } from "./IssueList.models";
import { FixButton, List, Ready } from "./IssueList.styles";

/** Every problem blocking the save, each with a Fix that jumps to it. */
export function IssueList({ issues, onFix }: IssueListProps) {
  const { t } = useTranslation();
  if (issues.length === 0) {
    return <Ready>{t("creator.review.ready", "Nothing missing. This class is ready to save.")}</Ready>;
  }
  return (
    <List>
      {issues.map((issue) => (
        <li key={`${issue.key}:${issue.path}`}>
          <FixButton type="button" onClick={() => onFix(issue)}>
            <span className="message">
              {t(issue.key, {
                ...issue.params,
                language: issue.language ? t(`creator.languageNames.${issue.language}`) : undefined,
              })}
            </span>
            <span className="fix">{t("creator.review.fix", "Fix")}</span>
          </FixButton>
        </li>
      ))}
    </List>
  );
}
