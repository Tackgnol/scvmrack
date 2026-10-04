import { CLASS_ITEM_TYPES, type ClassItemType } from "@/api/classes";
import { NumberStepper } from "@/components/atoms/NumberStepper/NumberStepper";
import { SegmentedChoice } from "@/components/atoms/SegmentedChoice/SegmentedChoice";
import { LocalizedField } from "@/components/molecules/LocalizedField/LocalizedField";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { GrantedByLine } from "../GrantedByLine/GrantedByLine";
import { ItemModifiers } from "../ItemModifiers/ItemModifiers";
import { ItemTypeFields } from "../ItemTypeFields/ItemTypeFields";
import { RemoveConfirm } from "../RemoveConfirm/RemoveConfirm";
import {
  Foot,
  Formula,
  GroupHeading,
  Head,
  OpenCard,
  SmallAction,
} from "../classCreator.styles";
import {
  fieldId,
  granterOf,
  itemStamp,
  LIMIT_LIST,
  LIMIT_NAME,
  LIMIT_TEXT,
} from "../classCreator.utils";
import type { ItemEditorProps } from "./ItemEditor.models";

/** The open Class Item card: who grants it, name, description, type and its numbers; Remove, Duplicate and Done. */
export function ItemEditor({
  draft,
  index,
  transitionName,
  language,
  showMissing,
  touch,
  focus,
  onChange,
  onChangeType,
  onGoToAbility,
  onGrantFromNewAbility,
  onDone,
  onRemove,
  onDuplicate,
  full,
}: ItemEditorProps) {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const item = draft.items[index];
  const path = `items.${index}`;
  const namePath = `${path}.name.${language}`;
  const descriptionPath = `${path}.description.${language}`;
  const name =
    item.name[language] || t("creator.items.untitled", "Unnamed Class Item");
  const granter = granterOf(draft, item.ref);

  return (
    <OpenCard
      id={fieldId(path)}
      role="group"
      aria-label={name}
      style={{ viewTransitionName: transitionName }}
    >
      <Head>
        <GroupHeading>{t(`creator.items.type.${item.type}`)}</GroupHeading>
      </Head>
      {confirming && granter && (
        <RemoveConfirm
          message={t(
            "creator.items.removeGranted",
            "“{{name}}” is granted by the ability “{{by}}”. Remove the item and clear that grant?",
            {
              name,
              by:
                draft.abilities[granter.index].name[language] ||
                t("creator.abilities.untitled", "Unnamed ability"),
            },
          )}
          actions={[
            {
              label: t("creator.items.removeAndClear", "Remove and clear"),
              danger: true,
              onClick: onRemove,
            },
            {
              label: t("creator.items.keepIt", "Keep it"),
              onClick: () => setConfirming(false),
            },
          ]}
        />
      )}
      <GrantedByLine
        draft={draft}
        item={item}
        path={path}
        language={language}
        onGoToAbility={onGoToAbility}
        onGrantFromNewAbility={onGrantFromNewAbility}
      />
      <LocalizedField
        id={fieldId(namePath)}
        label={t("creator.items.name", "Name")}
        value={item.name[language]}
        language={language}
        showMissing={showMissing(namePath)}
        maxLength={LIMIT_NAME}
        onChange={(value) =>
          onChange((it) => ({ ...it, name: { ...it.name, [language]: value } }))
        }
        onBlur={() => touch(namePath)}
      />
      <LocalizedField
        id={fieldId(descriptionPath)}
        label={t("creator.items.description", "Description (optional)")}
        value={item.description[language]}
        language={language}
        multiline
        showMissing={false}
        maxLength={LIMIT_TEXT}
        onChange={(value) =>
          onChange((it) => ({
            ...it,
            description: { ...it.description, [language]: value },
          }))
        }
        onBlur={() => touch(descriptionPath)}
      />
      <SegmentedChoice<ClassItemType>
        id={fieldId(`${path}.type`)}
        label={t("creator.items.typeLabel", "Type")}
        value={item.type}
        options={CLASS_ITEM_TYPES.map((type) => ({
          value: type,
          label: t(`creator.items.type.${type}`),
        }))}
        onChange={onChangeType}
      />
      <ItemTypeFields
        path={path}
        item={item}
        language={language}
        onChange={onChange}
      />
      <NumberStepper
        id={fieldId(`${path}.value`)}
        label={t("creator.items.value", "Value in silver")}
        value={item.value}
        min={0}
        max={9999}
        onChange={(value) => onChange((it) => ({ ...it, value }))}
      />
      <Formula className="wrap" aria-live="polite">
        {itemStamp(item, t)}
      </Formula>
      <ItemModifiers
        path={path}
        item={item}
        focus={focus}
        onChange={onChange}
      />
      <Foot>
        {!confirming && (
          <SmallAction
            type="button"
            className="kill"
            onClick={() => (granter ? setConfirming(true) : onRemove())}
          >
            {t("creator.remove", "Remove")}
          </SmallAction>
        )}
        <SmallAction
          type="button"
          disabled={full}
          title={
            full
              ? t(
                  "creator.items.full",
                  "A class holds at most {{max}} Class Items.",
                  { max: LIMIT_LIST },
                )
              : undefined
          }
          onClick={onDuplicate}
        >
          {t("creator.abilities.duplicate", "Duplicate")}
        </SmallAction>
        <SmallAction type="button" aria-expanded onClick={onDone}>
          {t("creator.abilities.done", "Done")}
        </SmallAction>
      </Foot>
    </OpenCard>
  );
}
