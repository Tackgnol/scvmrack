import { useTranslation } from "react-i18next";
import { ModifierList } from "../ModifierList/ModifierList";
import { Extras, SmallAction } from "../classCreator.styles";
import { MAX_MODIFIERS, fieldId, scopeExclude } from "../classCreator.utils";
import type { ItemModifiersProps } from "./ItemModifiers.models";
import { itemModifierState } from "./ItemModifiers.utils";

/** Edits modifiers granted by the currently selected Class Item type. */
export function ItemModifiers({
  path,
  item,
  focus,
  onChange,
}: ItemModifiersProps) {
  const { t } = useTranslation();
  const modifiers = itemModifierState(item, path, t, onChange);

  if (!modifiers) {
    return null;
  }

  return (
    <>
      <ModifierList
        path={modifiers.path}
        title={modifiers.title}
        modifiers={modifiers.list}
        onChange={modifiers.set}
        focus={focus}
        focusAfterRemove={`${path}.addModifier`}
      />
      <Extras>
        <SmallAction
          id={fieldId(`${path}.addModifier`)}
          type="button"
          disabled={modifiers.list.length >= MAX_MODIFIERS}
          onClick={() => {
            modifiers.set([
              ...modifiers.list,
              {
                statistic: "presence",
                value: 1,
                exclude: scopeExclude("all"),
              },
            ]);
            focus(`${modifiers.path}.${modifiers.list.length}.statistic`);
          }}
        >
          {t("creator.abilities.addModifier", "Add modifier")}
        </SmallAction>
      </Extras>
    </>
  );
}
