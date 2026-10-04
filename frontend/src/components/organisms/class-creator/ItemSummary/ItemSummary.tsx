import { useTranslation } from "react-i18next";
import { Chip, Chips, Edit, Kind, Name, Summary } from "../classCreator.styles";
import { itemStamp } from "../classCreator.utils";
import type { ItemSummaryProps } from "./ItemSummary.models";

/** A closed Class Item card: its type, name, stamp, who grants it, what it still misses, and Edit. */
export function ItemSummary({ id, transitionName, item, language, grantedBy, missing, onOpen }: ItemSummaryProps) {
  const { t } = useTranslation();
  const name = item.name[language];
  return (
    <Summary id={id} type="button" aria-expanded={false} onClick={onOpen} style={{ viewTransitionName: transitionName }}>
      <Kind className="fixed">{t(`creator.items.type.${item.type}`)}</Kind>
      <Name className={name ? undefined : "untitled"}>{name || t("creator.items.untitled", "Unnamed Class Item")}</Name>
      <Edit>{t("creator.abilities.edit", "Edit")}</Edit>
      <Chips>
        <Chip>{itemStamp(item, t)}</Chip>
        <Chip>
          {grantedBy
            ? t("creator.items.grantedByChip", "granted by {{name}}", { name: grantedBy })
            : t("creator.items.waits", "waits for an ability")}
        </Chip>
        {missing > 0 && (
          <Chip className="missing">{t("creator.missingCount", "{{count}} missing", { count: missing })}</Chip>
        )}
      </Chips>
    </Summary>
  );
}
