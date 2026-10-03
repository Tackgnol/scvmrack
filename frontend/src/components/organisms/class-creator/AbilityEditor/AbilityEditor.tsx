import { SegmentedChoice } from "@/components/atoms/SegmentedChoice/SegmentedChoice";
import { LocalizedField } from "@/components/molecules/LocalizedField/LocalizedField";
import { useStableIds } from "@/hooks/useStableIds";
import { useTranslation } from "react-i18next";
import { ModifierRow } from "../ModifierRow/ModifierRow";
import { GroupHeading, SmallAction, Stack } from "../classCreator.styles";
import { fieldId, LIMIT_LIST, LIMIT_NAME, LIMIT_TEXT, scopeExclude } from "../classCreator.utils";
import type { AbilityEditorProps } from "./AbilityEditor.models";
import { Extras, Foot, Head, OpenCard } from "./AbilityEditor.styles";

const MAX_MODIFIERS = 6;

/** The open ability card: Fixed or Random, name, rules text, modifiers; Remove, Duplicate and Done at the foot. */
export function AbilityEditor({
  draft,
  index,
  transitionName,
  language,
  randomNumber,
  showMissing,
  touch,
  focus,
  onChange,
  onDone,
  onRemove,
  onDuplicate,
  full,
}: AbilityEditorProps) {
  const { t } = useTranslation();
  const ability = draft.abilities[index];
  const base = `abilities.${index}`;
  const namePath = `${base}.name.${language}`;
  const textPath = `${base}.text.${language}`;
  const modifierIds = useStableIds(ability.modifiers.length);
  const addModifier = () => {
    modifierIds.insert(ability.modifiers.length);
    onChange((a) => ({
      ...a,
      modifiers: [...a.modifiers, { statistic: "presence", value: 1, exclude: scopeExclude("all") }],
    }));
    focus(`${base}.modifiers.${ability.modifiers.length}.statistic`);
  };

  return (
    <OpenCard id={fieldId(base)} role="group" style={{ viewTransitionName: transitionName }} aria-label={ability.name[language] || t("creator.abilities.untitled", "Unnamed ability")}>
      <Head>
        <GroupHeading>
          {randomNumber === null
            ? t("creator.abilities.fixed", "Fixed")
            : t("creator.abilities.randomN", "Random {{n}}", { n: randomNumber })}
        </GroupHeading>
      </Head>
      <SegmentedChoice<"fixed" | "random">
        id={fieldId(`${base}.random`)}
        label={t("creator.abilities.kind", "Every scvm gets it, or it is in the random pool")}
        value={ability.random ? "random" : "fixed"}
        options={[
          { value: "fixed", label: t("creator.abilities.fixed", "Fixed") },
          { value: "random", label: t("creator.abilities.random", "Random") },
        ]}
        onChange={(kind) => onChange((a) => ({ ...a, random: kind === "random" }))}
      />
      <LocalizedField
        id={fieldId(namePath)}
        label={t("creator.abilities.name", "Name")}
        value={ability.name[language]}
        language={language}
        showMissing={showMissing(namePath)}
        maxLength={LIMIT_NAME}
        onChange={(value) => onChange((a) => ({ ...a, name: { ...a.name, [language]: value } }))}
        onBlur={() => touch(namePath)}
      />
      <LocalizedField
        id={fieldId(textPath)}
        label={t("creator.abilities.text", "Rules text")}
        value={ability.text[language]}
        language={language}
        multiline
        showMissing={showMissing(textPath)}
        maxLength={LIMIT_TEXT}
        onChange={(value) => onChange((a) => ({ ...a, text: { ...a.text, [language]: value } }))}
        onBlur={() => touch(textPath)}
      />
      {ability.modifiers.length > 0 && (
        <Stack>
          <GroupHeading>{t("creator.abilities.modifiers", "Modifiers")}</GroupHeading>
          {ability.modifiers.map((modifier, m) => (
            <ModifierRow
              key={modifierIds.ids[m]}
              path={`${base}.modifiers.${m}`}
              index={m}
              modifier={modifier}
              onChange={(next) =>
                onChange((a) => ({ ...a, modifiers: a.modifiers.map((old, i) => (i === m ? next : old)) }))
              }
              onRemove={() => {
                modifierIds.remove(m);
                onChange((a) => ({ ...a, modifiers: a.modifiers.filter((_, i) => i !== m) }));
                focus(`${base}.addModifier`);
              }}
            />
          ))}
        </Stack>
      )}
      <Extras>
        <GroupHeading>{t("creator.abilities.extras", "Extras")}</GroupHeading>
        <SmallAction
          id={fieldId(`${base}.addModifier`)}
          type="button"
          disabled={ability.modifiers.length >= MAX_MODIFIERS}
          onClick={addModifier}
        >
          {t("creator.abilities.addModifier", "Add modifier")}
        </SmallAction>
      </Extras>
      <Foot>
        <SmallAction type="button" className="kill" onClick={onRemove}>
          {t("creator.remove", "Remove")}
        </SmallAction>
        <SmallAction
          type="button"
          disabled={full}
          title={full ? t("creator.abilities.full", "A class holds at most {{max}} abilities.", { max: LIMIT_LIST }) : undefined}
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
