import type { AbilityDraft, ClassItemType } from "@/api/classes";
import { NumberStepper } from "@/components/atoms/NumberStepper/NumberStepper";
import { useStableIds } from "@/hooks/useStableIds";
import { useTranslation } from "react-i18next";
import { AbilityEditor } from "../AbilityEditor/AbilityEditor";
import { withCardTransition } from "../cardTransition";
import { AbilitySummary } from "../AbilitySummary/AbilitySummary";
import { WaitingItemsTray } from "../WaitingItemsTray/WaitingItemsTray";
import { Counter, Empty, InkButton, Spread, Stack } from "../classCreator.styles";
import {
  blankAbility,
  blankClassItem,
  fieldId,
  LIMIT_LIST,
  randomNumber,
  randomPoolSize,
  slotFor,
} from "../classCreator.utils";
import type { AbilitiesStepProps } from "./AbilitiesStep.models";

/** Step 3: fixed abilities every scvm gets, and the random pool with how many each scvm rolls. */
export function AbilitiesStep({
  issues,
  openAbility,
  onOpenAbility,
  ...stepProps
}: AbilitiesStepProps) {
  const { t } = useTranslation();
  const { draft, update, focus, jump, language } = stepProps;
  const { ids, insert, remove } = useStableIds(draft.abilities.length);
  const pool = randomPoolSize(draft);
  const full = draft.abilities.length >= LIMIT_LIST;
  const cardId = (index: number) => fieldId(`abilities.${index}`);

  const setAbility = (index: number, recipe: (ability: AbilityDraft) => AbilityDraft) =>
    update((d) => ({ ...d, abilities: d.abilities.map((a, i) => (i === index ? recipe(a) : a)) }));
  const open = (index: number | null, focusPath: string) =>
    withCardTransition(index === null, () => onOpenAbility(index), () => focus(focusPath));
  const add = () => {
    const index = draft.abilities.length;
    insert(index);
    update((d) => ({ ...d, abilities: [...d.abilities, blankAbility()] }));
    open(index, `abilities.${index}.name.${stepProps.language}`);
  };
  const duplicate = (index: number) => {
    insert(index + 1);
    update((d) => {
      // A copy is a new ability with its own key on save; an item has one granter, so the copy grants none.
      const copy = { ...structuredClone(d.abilities[index]), key: undefined, grantItem: null, grantPet: null };
      return { ...d, abilities: [...d.abilities.slice(0, index + 1), copy, ...d.abilities.slice(index + 1)] };
    });
    open(index + 1, `abilities.${index + 1}.name.${stepProps.language}`);
  };
  const grantFromNewAbility = (itemIndex: number) => {
    const item = draft.items[itemIndex];
    const index = draft.abilities.length;
    insert(index);
    update((d) => ({
      ...d,
      abilities: [...d.abilities, { ...blankAbility(), name: { ...item.name }, [slotFor(item.type)]: item.ref }],
    }));
    open(index, `abilities.${index}.text.${language}`);
  };
  const forge = (index: number, type: ClassItemType) => {
    const ability = draft.abilities[index];
    const item = { ...blankClassItem(type), name: { ...ability.name } };
    update((d) => ({
      ...d,
      items: [...d.items, item],
      abilities: d.abilities.map((a, i) => (i === index ? { ...a, [slotFor(type)]: item.ref } : a)),
    }));
    focus(`abilities.${index}.${slotFor(type)}`);
  };
  const removeAt = (index: number, withItems: boolean) => {
    const granted = [draft.abilities[index].grantItem, draft.abilities[index].grantPet];
    remove(index);
    update((d) => {
      const items = withItems ? d.items.filter((item) => !granted.includes(item.ref)) : d.items;
      const abilities = d.abilities.filter((_, i) => i !== index);
      const stillRandom = abilities.filter((a) => a.random).length;
      return { ...d, items, abilities, randomAbilityCount: Math.min(d.randomAbilityCount, stillRandom) };
    });
    onOpenAbility(null);
    focus(draft.abilities.length > 1 ? `abilities.${Math.min(index, draft.abilities.length - 2)}` : "abilities.add");
  };

  return (
    <Stack>
      <WaitingItemsTray draft={draft} language={language} onGrantFromNewAbility={grantFromNewAbility} />
      <Spread>
        <NumberStepper
          id={fieldId("randomAbilityCount")}
          label={t("creator.abilities.rolled", "Random abilities rolled")}
          value={draft.randomAbilityCount}
          min={0}
          max={Math.max(pool, draft.randomAbilityCount)}
          hint={t(
            "creator.abilities.rolledHint",
            "Every scvm gets all Fixed abilities, plus this many from the Random pool ({{pool}} in it). A zine's “roll d6 for your ability” is a pool of 6 with 1 rolled.",
            { pool },
          )}
          onChange={(randomAbilityCount) => update((d) => ({ ...d, randomAbilityCount }))}
        />
        <Counter>
          {t("creator.abilities.count", "{{count}} of {{max}} abilities", {
            count: draft.abilities.length,
            max: LIMIT_LIST,
          })}
        </Counter>
      </Spread>
      {draft.abilities.length === 0 && (
        <Empty>
          {t("creator.abilities.empty", "No abilities yet. Add a fixed one every scvm gets, or build a random pool.")}
        </Empty>
      )}
      {draft.abilities.map((ability, index) =>
        openAbility === index ? (
          <AbilityEditor
            key={ids[index]}
            transitionName={`ability-${ids[index]}`}
            {...stepProps}
            index={index}
            randomNumber={randomNumber(draft, index)}
            full={full}
            onChange={(recipe) => setAbility(index, recipe)}
            onDone={() => open(null, `abilities.${index}`)}
            onRemove={(withItems) => removeAt(index, withItems)}
            onGrant={(slot, ref) => setAbility(index, (a) => ({ ...a, [slot]: ref }))}
            onForge={(type) => forge(index, type)}
            onEditItem={(itemIndex) => jump("items", `items.${itemIndex}.name.${language}`)}
            onDuplicate={() => duplicate(index)}
          />
        ) : (
          <AbilitySummary
            key={ids[index]}
            transitionName={`ability-${ids[index]}`}
            id={cardId(index)}
            ability={ability}
            language={stepProps.language}
            randomNumber={randomNumber(draft, index)}
            missing={issues.filter((issue) => issue.path.startsWith(`abilities.${index}.`)).length}
            onOpen={() => open(index, `abilities.${index}.random`)}
          />
        ),
      )}
      <div style={{ viewTransitionName: "abilities-add" }}>
        <InkButton
          id={fieldId("abilities.add")}
          type="button"
          disabled={full}
          title={full ? t("creator.abilities.full", "A class holds at most {{max}} abilities.", { max: LIMIT_LIST }) : undefined}
          onClick={add}
        >
          {t("creator.abilities.add", "Add ability")}
        </InkButton>
      </div>
    </Stack>
  );
}
