import { useTranslation } from "react-i18next";
import { LinkLine, SmallAction } from "../creatorShared.styles";
import { fieldId, granterOf, randomPoolSize } from "../creatorShared.utils";
import type { GrantedByLineProps } from "./GrantedByLine.models";

/** Which ability gets this Class Item to a scvm, and how often; or that none does yet. */
export function GrantedByLine({ draft, item, path, language, onGoToAbility, onGrantFromNewAbility }: GrantedByLineProps) {
  const { t } = useTranslation();
  const granter = granterOf(draft, item.ref);
  if (!granter) {
    return (
      <LinkLine>
        <span className="muted">{t("creator.items.notGranted", "Not granted yet")}</span>
        <SmallAction id={fieldId(`${path}.grantNew`)} type="button" onClick={onGrantFromNewAbility}>
          {t("creator.items.grantFromNew", "Grant from a new ability")}
        </SmallAction>
      </LinkLine>
    );
  }
  const ability = draft.abilities[granter.index];
  return (
    <LinkLine>
      <span>{t("creator.items.grantedBy", "Granted by")}</span>
      <b>{ability.name[language] || t("creator.abilities.untitled", "Unnamed ability")}</b>
      <span className="odds">
        {ability.random
          ? t("creator.items.ifRolled", "if rolled, {{n}} of {{m}}", {
              n: draft.randomAbilityCount,
              m: randomPoolSize(draft),
            })
          : t("creator.items.everyScvm", "every scvm")}
      </span>
      <SmallAction type="button" onClick={() => onGoToAbility(granter.index)}>
        {t("creator.items.goToAbility", "Go to ability")}
      </SmallAction>
    </LinkLine>
  );
}
