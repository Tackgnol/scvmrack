import {
  CLASS_ITEM_TYPES,
  type AbilityModifierDraft,
  type ClassItemType,
} from "@/api/classes";
import { NumberStepper } from "@/components/atoms/NumberStepper/NumberStepper";
import { SegmentedChoice } from "@/components/atoms/SegmentedChoice/SegmentedChoice";
import { LocalizedField } from "@/components/molecules/LocalizedField/LocalizedField";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArmorFields } from "../ArmorFields/ArmorFields";
import { GearFields } from "../GearFields/GearFields";
import { GrantedByLine } from "../GrantedByLine/GrantedByLine";
import { ModifierList } from "../ModifierList/ModifierList";
import { PetFields } from "../PetFields/PetFields";
import { RemoveConfirm } from "../RemoveConfirm/RemoveConfirm";
import { WeaponFields } from "../WeaponFields/WeaponFields";
import {
  Extras,
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
  MAX_MODIFIERS,
  scopeExclude,
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
  // Which modifier list this type carries: wielded, worn, temporary, or a pet's buffs.
  const mods: {
    list: AbilityModifierDraft[];
    title: string;
    set: (list: AbilityModifierDraft[]) => void;
  } | null =
    item.type === "weapon"
      ? {
          list: item.weapon.modifiers,
          title: t("creator.items.whileWielded", "Modifiers while wielded"),
          set: (modifiers) =>
            onChange((it) => ({ ...it, weapon: { ...it.weapon, modifiers } })),
        }
      : item.type === "armor"
        ? {
            list: item.armor.modifiers,
            title: t("creator.items.whileWorn", "Modifiers while worn"),
            set: (modifiers) =>
              onChange((it) => ({ ...it, armor: { ...it.armor, modifiers } })),
          }
        : item.type === "gear"
          ? {
              list: item.gear.statuses,
              title: t(
                "creator.items.temporaryStatuses",
                "Temporary status effects",
              ),
              set: (statuses) =>
                onChange((it) => ({ ...it, gear: { ...it.gear, statuses } })),
            }
          : item.type === "pet" && item.pet.action === "buff"
            ? {
                list: item.pet.buffs,
                title: t("creator.items.buffsGiven", "Buffs it gives"),
                set: (buffs) =>
                  onChange((it) => ({ ...it, pet: { ...it.pet, buffs } })),
              }
            : null;
  const modsPath = `${path}.${item.type}.${item.type === "pet" ? "buffs" : item.type === "gear" ? "statuses" : "modifiers"}`;

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
      {item.type === "weapon" && (
        <WeaponFields
          path={path}
          item={item}
          language={language}
          onChange={(weapon) => onChange((it) => ({ ...it, weapon }))}
        />
      )}
      {item.type === "armor" && (
        <ArmorFields
          path={path}
          item={item}
          language={language}
          onChange={(armor) => onChange((it) => ({ ...it, armor }))}
        />
      )}
      {item.type === "gear" && (
        <GearFields
          path={path}
          item={item}
          language={language}
          onChange={(gear) => onChange((it) => ({ ...it, gear }))}
        />
      )}
      {item.type === "pet" && (
        <PetFields
          path={path}
          item={item}
          language={language}
          onChange={(pet) => onChange((it) => ({ ...it, pet }))}
        />
      )}
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
      {mods && (
        <ModifierList
          path={modsPath}
          title={mods.title}
          modifiers={mods.list}
          onChange={mods.set}
          focus={focus}
          focusAfterRemove={`${path}.addModifier`}
        />
      )}
      {mods && (
        <Extras>
          <SmallAction
            id={fieldId(`${path}.addModifier`)}
            type="button"
            disabled={mods.list.length >= MAX_MODIFIERS}
            onClick={() => {
              mods.set([
                ...mods.list,
                {
                  statistic: "presence",
                  value: 1,
                  exclude: scopeExclude("all"),
                },
              ]);
              focus(`${modsPath}.${mods.list.length}.statistic`);
            }}
          >
            {t("creator.abilities.addModifier", "Add modifier")}
          </SmallAction>
        </Extras>
      )}
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
