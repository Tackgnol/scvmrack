import { useTranslation } from "react-i18next";
import { ActButton, Notice } from "../classPool.styles";
import type { RemovedClassNoticeProps } from "./RemovedClassNotice.models";

/** "Class X has been removed by Y": a pooled class that is gone; dismissing drops it from the pool. */
export function RemovedClassNotice({ removed, onDismiss }: RemovedClassNoticeProps) {
  const { t } = useTranslation();
  return (
    <Notice role="status" data-testid="removed-class-notice">
      <p>
        {removed.reason === "taken_down"
          ? t(
              "classPool.removed.takenDown",
              "“{{name}}” has been taken down. It's no longer in this pool; scvm already playing it keep it.",
              { name: removed.name },
            )
          : removed.by === null
          ? t(
              "classPool.removed.byUnknown",
              "“{{name}}” has been removed by its author ({{why}}). It's no longer in this pool; scvm already playing it keep it.",
              { name: removed.name, why: t(`classPool.removed.why.${removed.reason}`) },
            )
          : t(
              "classPool.removed.byAuthor",
              "“{{name}}” has been removed by {{by}} ({{why}}). It's no longer in this pool; scvm already playing it keep it.",
              {
                name: removed.name,
                by: removed.by,
                why: t(`classPool.removed.why.${removed.reason}`),
              },
            )}
      </p>
      <ActButton type="button" onClick={() => onDismiss(removed)}>
        {t("classPool.removed.dismiss", "Got it")}
      </ActButton>
    </Notice>
  );
}
