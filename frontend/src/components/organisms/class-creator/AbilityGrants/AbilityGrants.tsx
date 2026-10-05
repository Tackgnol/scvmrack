import { CLASS_ITEM_TYPES, type ClassItemType } from "@/api/classes";
import type { ItemSearchHit } from "@/hooks/useEquipmentSearch";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CatalogGrantPicker } from "./CatalogGrantPicker";
import { LinkLine, SmallAction, Stack } from "../classCreator.styles";
import {
  fieldId,
  granterOf,
  itemStamp,
  randomPoolSize,
  slotFor,
} from "../classCreator.utils";
import type { GrantSlot } from "../classCreator.models";
import type { AbilityGrantsProps } from "./AbilityGrants.models";
import { ForgeRow } from "./AbilityGrants.styles";

/** What an ability grants: one Class Item and one pet, each a link to its item, or a new item forged for it. */
export function AbilityGrants({
  draft,
  index,
  language,
  onGrant,
  onForge,
  onEditItem,
}: AbilityGrantsProps) {
  const { t } = useTranslation();
  const [forging, setForging] = useState(false);
  const ability = draft.abilities[index];
  const base = `abilities.${index}`;
  const nameOf = (i: number) =>
    draft.items[i].name[language] ||
    t("creator.items.untitled", "Unnamed Class Item");
  const odds = ability.random
    ? t("creator.items.ifRolled", "if rolled, {{n}} of {{m}}", {
        n: draft.randomAbilityCount,
        m: randomPoolSize(draft),
      })
    : t("creator.items.everyScvm", "every scvm");
  const abilityName = ability.name[language].trim().toLowerCase();
  const waitingNamesake = draft.items.findIndex(
    (item) =>
      !granterOf(draft, item.ref) &&
      abilityName &&
      item.name[language].trim().toLowerCase() === abilityName,
  );
  const blockedBy = (type: ClassItemType) => {
    const taken = ability[slotFor(type)];
    const i = draft.items.findIndex((item) => item.ref === taken);
    return i >= 0
      ? t("creator.items.slotTaken", "This ability already grants “{{name}}”", {
          name: nameOf(i),
        })
      : undefined;
  };

  return (
    <Stack>
      {(["grantItem", "grantPet"] as GrantSlot[]).map((slot) => {
        const path = `${base}.${slot}`;
        const current = ability[slot];
        const granted = draft.items.findIndex((item) => item.ref === current);
        const pinnedOptions: ItemSearchHit[] = draft.items
          .map((item, i) => ({ item, i }))
          .filter(({ item }) => slotFor(item.type) === slot)
          .map(({ item, i }) => ({
            id: -i - 1,
            key: item.ref,
            name: nameOf(i),
            itemType: item.type === "gear" ? "equipment" : item.type,
            tags: [],
          }));
        const disabledPinnedKeys = draft.items
          .filter((item) => slotFor(item.type) === slot)
          .filter((item) => {
            const owner = granterOf(draft, item.ref);
            return owner !== null && owner.index !== index;
          })
          .map((item) => item.ref);
        return (
          <div key={slot}>
            <CatalogGrantPicker
              id={fieldId(path)}
              label={slot === "grantPet" ? t("creator.items.grantsPet", "Grants a pet") : t("creator.items.grantsItem", "Grants an item")}
              pinnedOptions={pinnedOptions}
              disabledPinnedKeys={disabledPinnedKeys}
              pet={slot === "grantPet"}
              onSelect={(key) => onGrant(slot, key)}
              onClear={() => onGrant(slot, null)}
            />
            {granted >= 0 && (
              <LinkLine>
                <span className="badge">
                  {t(`creator.items.type.${draft.items[granted].type}`)}
                </span>
                <span>{itemStamp(draft.items[granted], t)}</span>
                <span className="odds">{odds}</span>
                <SmallAction type="button" onClick={() => onEditItem(granted)}>
                  {t("creator.items.editStats", "Edit stats")}
                </SmallAction>
              </LinkLine>
            )}
          </div>
        );
      })}
      {waitingNamesake >= 0 ? (
        <div>
          <SmallAction
            type="button"
            disabled={Boolean(blockedBy(draft.items[waitingNamesake].type))}
            title={blockedBy(draft.items[waitingNamesake].type)}
            onClick={() =>
              onGrant(
                slotFor(draft.items[waitingNamesake].type),
                draft.items[waitingNamesake].ref,
              )
            }
          >
            {t(
              "creator.items.grantWaiting",
              "Grant the waiting {{type}} “{{name}}”",
              {
                type: t(
                  `creator.items.typeLower.${draft.items[waitingNamesake].type}`,
                ),
                name: nameOf(waitingNamesake),
              },
            )}
          </SmallAction>
        </div>
      ) : (
        <ForgeRow>
          <SmallAction
            id={fieldId(`${base}.forge`)}
            type="button"
            aria-expanded={forging}
            onClick={() => setForging(!forging)}
          >
            {t("creator.items.forgeFor", "Forge a Class Item for this ability")}
          </SmallAction>
          {forging &&
            CLASS_ITEM_TYPES.map((type) => {
              const reason = blockedBy(type);
              return (
                <SmallAction
                  key={type}
                  type="button"
                  disabled={Boolean(reason)}
                  title={reason}
                  aria-label={
                    reason
                      ? `${t(`creator.items.type.${type}`)}: ${reason}`
                      : undefined
                  }
                  onClick={() => {
                    setForging(false);
                    onForge(type);
                  }}
                >
                  {t(`creator.items.type.${type}`)}
                </SmallAction>
              );
            })}
        </ForgeRow>
      )}
    </Stack>
  );
}
