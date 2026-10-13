import {
  CLASS_ITEM_TYPES,
  type ClassItemDraft,
  type ClassItemType,
} from "@/api/classes";
import { useStableIds } from "@/hooks/useStableIds";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Reorderable } from "../Reorderable/Reorderable";
import { ItemEditor } from "../ItemEditor/ItemEditor";
import { ItemSummary } from "../ItemSummary/ItemSummary";
import { withCardTransition } from "../cardTransition";
import { movedIndex, moveEntry } from "../reorder.utils";
import {
  Counter,
  Empty,
  GroupHeading,
  Hint,
  InkButton,
  SmallAction,
  Spread,
  Stack,
} from "../classCreator.styles";
import {
  blankAbility,
  blankClassItem,
  changeItemType,
  fieldId,
  granterOf,
  LIMIT_LIST,
  removeItem,
  slotFor,
} from "../classCreator.utils";
import type { GateAnswer, ItemsStepProps } from "./ItemsStep.models";
import { Gate, GateNo } from "./ItemsStep.styles";

/** Class Items: gear and beasts only this class has, each reaching a scvm through one ability. */
export function ItemsStep({
  issues,
  openItem,
  onOpenItem,
  ...stepProps
}: ItemsStepProps) {
  const { t } = useTranslation();
  const { draft, update, focus, jump, language } = stepProps;
  // Not stored: whether the class carries items is whether it has any.
  const [answer, setAnswer] = useState<GateAnswer>("unasked");
  const { ids, insert, remove, move } = useStableIds(draft.items.length);
  const full = draft.items.length >= LIMIT_LIST;

  const open = (index: number | null, focusPath: string) =>
    withCardTransition(
      index === null,
      () => onOpenItem(index),
      () => focus(focusPath),
    );
  const setItem = (
    index: number,
    recipe: (item: ClassItemDraft) => ClassItemDraft,
  ) =>
    update((d) => ({
      ...d,
      items: d.items.map((it, i) => (i === index ? recipe(it) : it)),
    }));
  const add = (type: ClassItemType) => {
    const index = draft.items.length;
    insert(index);
    update((d) => ({ ...d, items: [...d.items, blankClassItem(type)] }));
    open(index, `items.${index}.name.${language}`);
  };
  const duplicate = (index: number) => {
    insert(index + 1);
    // A copy is a new item: its own key on save, and no granter yet (an item has one).
    update((d) => {
      const copy = {
        ...structuredClone(d.items[index]),
        ref: blankClassItem(d.items[index].type).ref,
      };
      return {
        ...d,
        items: [
          ...d.items.slice(0, index + 1),
          copy,
          ...d.items.slice(index + 1),
        ],
      };
    });
    open(index + 1, `items.${index + 1}.name.${language}`);
  };
  const removeAt = (index: number) => {
    remove(index);
    update((d) => removeItem(d, index));
    onOpenItem(null);
    focus(
      draft.items.length > 1
        ? `items.${Math.min(index, draft.items.length - 2)}`
        : "items.forge",
    );
  };
  const grantFromNewAbility = (index: number) => {
    const item = draft.items[index];
    const abilityIndex = draft.abilities.length;
    update((d) => ({
      ...d,
      abilities: [
        ...d.abilities,
        {
          ...blankAbility(),
          name: { ...item.name },
          [slotFor(item.type)]: item.ref,
        },
      ],
    }));
    jump("abilities", `abilities.${abilityIndex}.text.${language}`);
  };

  const reorder = (from: number, to: number) => {
    move(from, to);
    onOpenItem(movedIndex(openItem, from, to));
    update((d) => ({ ...d, items: moveEntry(d.items, from, to) }));
  };

  if (draft.items.length === 0 && answer === "no") {
    return (
      <GateNo>
        <p>
          {t(
            "creator.items.none",
            "No Class Items. Abilities can still grant gear from the shared catalog.",
          )}
        </p>
        <SmallAction type="button" onClick={() => setAnswer("unasked")}>
          {t("creator.items.change", "Change")}
        </SmallAction>
      </GateNo>
    );
  }
  if (draft.items.length === 0 && answer === "unasked") {
    return (
      <Gate>
        <h3>
          {t(
            "creator.items.question",
            "Does this class carry its own gear or beasts?",
          )}
        </h3>
        <p>
          {t(
            "creator.items.questionHint",
            "Class Items are weapons, armor, gear or pets only this class has, like the Fanged Deserter's Brown Scimitar. Each one reaches a scvm through one ability.",
          )}
        </p>
        <Spread>
          <InkButton type="button" onClick={() => setAnswer("yes")}>
            {t("creator.items.yes", "Yes, forge a Class Item")}
          </InkButton>
          <InkButton type="button" onClick={() => setAnswer("no")}>
            {t("creator.items.no", "No, only catalog gear")}
          </InkButton>
        </Spread>
      </Gate>
    );
  }

  return (
    <Stack>
      <Hint>
        {t(
          "creator.reorder.itemsHint",
          "This is the order Class Items appear wherever this class lists them.",
        )}
      </Hint>
      <Spread>
        <Spread id={fieldId("items.forge")} tabIndex={-1}>
          <GroupHeading>{t("creator.items.forge", "Forge")}</GroupHeading>
          {CLASS_ITEM_TYPES.map((type) => (
            <SmallAction
              key={type}
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
              onClick={() => add(type)}
            >
              {t(`creator.items.type.${type}`)}
            </SmallAction>
          ))}
        </Spread>
        <Counter>
          {t("creator.items.count", "{{count}} of {{max}} Class Items", {
            count: draft.items.length,
            max: LIMIT_LIST,
          })}
        </Counter>
      </Spread>
      {draft.items.length === 0 && (
        <Empty>
          {t("creator.items.empty", "No Class Items yet. Pick a kind above.")}
        </Empty>
      )}
      {draft.items.map((item, index) => {
        const granter = granterOf(draft, item.ref);
        return (
          <Reorderable
            key={ids[index]}
            count={draft.items.length}
            index={index}
            itemId={ids[index]}
            label={
              item.name[language] ||
              t("creator.items.untitled", "Unnamed Class Item")
            }
            listId="items"
            onMove={reorder}
          >
            {openItem === index ? (
              <ItemEditor
                {...stepProps}
                index={index}
                transitionName={`item-${ids[index]}`}
                full={full}
                onChange={(recipe) => setItem(index, recipe)}
                onChangeType={(type) =>
                  update((d) => changeItemType(d, index, type))
                }
                onGoToAbility={(abilityIndex) =>
                  jump(
                    "abilities",
                    `abilities.${abilityIndex}.name.${language}`,
                  )
                }
                onGrantFromNewAbility={() => grantFromNewAbility(index)}
                onDone={() => open(null, `items.${index}`)}
                onRemove={() => removeAt(index)}
                onDuplicate={() => duplicate(index)}
              />
            ) : (
              <ItemSummary
                id={fieldId(`items.${index}`)}
                transitionName={`item-${ids[index]}`}
                item={item}
                language={language}
                grantedBy={
                  granter
                    ? draft.abilities[granter.index].name[language] ||
                      t("creator.abilities.untitled", "Unnamed ability")
                    : null
                }
                missing={
                  issues.filter(
                    (issue) =>
                      issue.path.startsWith(`items.${index}.`) &&
                      issue.step === "items",
                  ).length
                }
                onOpen={() => open(index, `items.${index}.name.${language}`)}
              />
            )}
          </Reorderable>
        );
      })}
    </Stack>
  );
}
