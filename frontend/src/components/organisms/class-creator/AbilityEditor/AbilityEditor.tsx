import { scopeToExclude } from "@/components/modifiers/utils";
import { SegmentedChoice } from "@/components/atoms/SegmentedChoice/SegmentedChoice";
import { LocalizedField } from "@/components/molecules/LocalizedField/LocalizedField";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AbilityGrants } from "../AbilityGrants/AbilityGrants";
import { ModifierList } from "../ModifierList/ModifierList";
import { AbilityReferenceTableEditor } from "../AbilityReferenceTableEditor/AbilityReferenceTableEditor";
import { RemoveConfirm } from "../RemoveConfirm/RemoveConfirm";
import {
  Extras,
  Foot,
  GroupHeading,
  Head,
  OpenCard,
  SmallAction,
} from "../creatorShared.styles";
import { fieldId, LIMIT_LIST, LIMIT_NAME, LIMIT_TEXT, MAX_MODIFIERS } from "../creatorShared.utils";
import type { AbilityEditorProps } from "./AbilityEditor.models";

/** The open ability card: Fixed or Random, name, rules text, grants, modifiers; Remove, Duplicate and Done at the foot. */
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
  onZinePaste,
  onGrant,
  onForge,
  onEditItem,
  onDone,
  onRemove,
  onDuplicate,
  full,
}: AbilityEditorProps) {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const ability = draft.abilities[index];
  const base = `abilities.${index}`;
  const namePath = `${base}.name.${language}`;
  const textPath = `${base}.text.${language}`;
  const granted = draft.items.filter(
    (item) => item.ref === ability.grantItem || item.ref === ability.grantPet,
  );
  const grantedNames = granted
    .map(
      (item) =>
        `“${item.name[language] || t("creator.items.untitled", "Unnamed Class Item")}”`,
    )
    .join(", ");
  const addModifier = () => {
    onChange((a) => ({
      ...a,
      modifiers: [
        ...a.modifiers,
        { statistic: "presence", value: 1, exclude: scopeToExclude("all") },
      ],
    }));
    focus(`${base}.modifiers.${ability.modifiers.length}.statistic`);
  };

  return (
    <OpenCard
      id={fieldId(base)}
      role="group"
      style={{ viewTransitionName: transitionName }}
      aria-label={
        ability.name[language] ||
        t("creator.abilities.untitled", "Unnamed ability")
      }
    >
      <Head>
        <GroupHeading>
          {randomNumber === null
            ? t("creator.abilities.fixed", "Fixed")
            : t("creator.abilities.randomN", "Random {{n}}", {
                n: randomNumber,
              })}
        </GroupHeading>
      </Head>
      {confirming && (
        <RemoveConfirm
          message={t(
            "creator.abilities.removeGranter",
            "Only this ability grants {{items}}. Remove the item too, or keep it waiting for another ability?",
            { items: grantedNames },
          )}
          actions={[
            {
              label: t("creator.abilities.removeBoth", "Remove both"),
              danger: true,
              onClick: () => onRemove(true),
            },
            {
              label: t(
                "creator.abilities.keepItem",
                "Keep the item, ungranted",
              ),
              onClick: () => onRemove(false),
            },
            {
              label: t("creator.cancel", "Cancel"),
              onClick: () => setConfirming(false),
            },
          ]}
        />
      )}
      <SegmentedChoice<"fixed" | "random">
        id={fieldId(`${base}.random`)}
        label={t(
          "creator.abilities.kind",
          "Every scvm gets it, or it is in the random pool",
        )}
        value={ability.random ? "random" : "fixed"}
        options={[
          { value: "fixed", label: t("creator.abilities.fixed", "Fixed") },
          { value: "random", label: t("creator.abilities.random", "Random") },
        ]}
        onChange={(kind) =>
          onChange((a) => ({ ...a, random: kind === "random" }))
        }
      />
      <LocalizedField
        id={fieldId(namePath)}
        label={t("creator.abilities.name", "Name")}
        value={ability.name[language]}
        language={language}
        showMissing={showMissing(namePath)}
        maxLength={LIMIT_NAME}
        onChange={(value) =>
          onChange((a) => ({ ...a, name: { ...a.name, [language]: value } }))
        }
        onBlur={() => touch(namePath)}
        onPaste={(event) => {
          const value = event.clipboardData.getData("text");
          if (value.split(/\r?\n/).filter(Boolean).length < 2) {
            return;
          }
          event.preventDefault();
          onZinePaste(value);
        }}
      />
      <LocalizedField
        id={fieldId(textPath)}
        label={t("creator.abilities.text", "Rules text")}
        value={ability.text[language]}
        language={language}
        multiline
        showMissing={showMissing(textPath)}
        maxLength={LIMIT_TEXT}
        onChange={(value) =>
          onChange((a) => ({ ...a, text: { ...a.text, [language]: value } }))
        }
        onBlur={() => touch(textPath)}
      />
      <AbilityGrants
        draft={draft}
        index={index}
        language={language}
        onGrant={onGrant}
        onForge={onForge}
        onEditItem={onEditItem}
      />
      <AbilityReferenceTableEditor
        ability={ability}
        base={base}
        draft={draft}
        index={index}
        language={language}
        onChange={onChange}
        showMissing={showMissing}
        touch={touch}
      />
      <ModifierList
        path={`${base}.modifiers`}
        title={t("creator.abilities.modifiers", "Modifiers")}
        modifiers={ability.modifiers}
        onChange={(modifiers) => onChange((a) => ({ ...a, modifiers }))}
        focus={focus}
        focusAfterRemove={`${base}.addModifier`}
      />
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
        {!confirming && (
          <SmallAction
            type="button"
            className="kill"
            onClick={() =>
              granted.length > 0 ? setConfirming(true) : onRemove(false)
            }
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
                  "creator.abilities.full",
                  "A class holds at most {{max}} abilities.",
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
