import { useTranslation } from "react-i18next";
import { GroupHeading, SmallAction } from "../classCreator.styles";
import { fieldId, granterOf, itemStamp } from "../classCreator.utils";
import type { WaitingItemsTrayProps } from "./WaitingItemsTray.models";
import { Tray, Waiting } from "./WaitingItemsTray.styles";

/** Class Items no ability grants yet; each needs one before the class can be saved. */
export function WaitingItemsTray({ draft, language, onGrantFromNewAbility }: WaitingItemsTrayProps) {
  const { t } = useTranslation();
  const waiting = draft.items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !granterOf(draft, item.ref));
  if (waiting.length === 0) {
    return null;
  }

  return (
    <Tray aria-labelledby="waiting-items">
      <GroupHeading id="waiting-items">
        {t("creator.items.waitingTitle", "Class Items waiting for an ability")}
      </GroupHeading>
      {waiting.map(({ item, index }) => {
        const name = item.name[language] || t("creator.items.untitled", "Unnamed Class Item");
        return (
          <Waiting key={item.ref}>
            <span className="badge">{t(`creator.items.type.${item.type}`)}</span>
            <span className="name">{name}</span>
            <span>{itemStamp(item, t)}</span>
            <SmallAction
              id={fieldId(`items.${index}.grant`)}
              type="button"
              aria-label={t("creator.items.grantFromNewLabel", "Grant {{name}} from a new ability", { name })}
              onClick={() => onGrantFromNewAbility(index)}
            >
              {t("creator.items.grantFromNew", "Grant from a new ability")}
            </SmallAction>
          </Waiting>
        );
      })}
    </Tray>
  );
}
