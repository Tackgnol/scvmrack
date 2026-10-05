import type { AbilityDraft, ClassDraft, ClassLanguage } from "@/api/classes";
import { NumberStepper } from "@/components/atoms/NumberStepper/NumberStepper";
import { Select } from "@/components/atoms/Select/Select";
import { LocalizedField } from "@/components/molecules/LocalizedField/LocalizedField";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { fieldId, LIMIT_TEXT } from "../classCreator.utils";
import { SmallAction } from "../classCreator.styles";

type Props = {
  ability: AbilityDraft;
  base: string;
  draft: ClassDraft;
  index: number;
  language: ClassLanguage;
  onChange: (recipe: (ability: AbilityDraft) => AbilityDraft) => void;
  showMissing: (path: string) => boolean;
  touch: (path: string) => void;
};

const emptyRow = () => ({ text: { en: "", pl: "" }, itemRef: null });
const TABLE_DICE = [2, 3, 4, 6, 8, 10, 12] as const;

/** Edits one ability’s optional dN reference table and its Class Item row links. */
export function AbilityReferenceTableEditor({ ability, base, draft, index, language, onChange, showMissing, touch }: Props) {
  const { t } = useTranslation();
  const [parkedRows, setParkedRows] = useState<NonNullable<AbilityDraft["table"]>["rows"]>([]);
  const table = ability.table;
  const itemUsedElsewhere = (ref: string, row: number) => draft.abilities.some((candidate, abilityIndex) =>
    candidate.grantItem === ref || candidate.grantPet === ref || candidate.table?.rows.some((entry, rowIndex) =>
      entry.itemRef === ref && (abilityIndex !== index || rowIndex !== row),
    ),
  );
  if (!table) {
    return <SmallAction id={fieldId(`${base}.addTable`)} type="button" onClick={() => onChange((entry) => ({ ...entry, table: { die: 6, rows: Array.from({ length: 6 }, emptyRow) } }))}>{t("creator.abilities.addTable", "Add reference table")}</SmallAction>;
  }
  const resize = (die: number) => {
    const nextDie = (die < table.die
      ? [...TABLE_DICE].reverse().find((candidate) => candidate <= die)
      : TABLE_DICE.find((candidate) => candidate >= die)) ?? table.die;
    const kept = table.rows.slice(0, nextDie);
    if (nextDie < table.die) setParkedRows(table.rows.slice(nextDie));
    const restored = nextDie > table.die ? parkedRows.slice(0, nextDie - kept.length) : [];
    const rows = [...kept, ...restored];
    while (rows.length < nextDie) rows.push(emptyRow());
    onChange((entry) => ({ ...entry, table: { die: nextDie, rows } }));
  };
  return (
    <section aria-label={t("creator.abilities.referenceTable", "Reference table")}>
      <NumberStepper id={fieldId(`${base}.table.die`)} label={t("creator.abilities.tableDie", "Table die")} value={table.die} min={2} max={12} onChange={resize} hint={t("creator.abilities.tableHint", "The row number is the die result.")} />
      {table.rows.map((row, roll) => (
        <div key={roll}>
          <LocalizedField
            id={fieldId(`${base}.table.rows.${roll}.text.${language}`)}
            label={t("creator.abilities.tableRow", "Result {{roll}}", { roll: roll + 1 })}
            value={row.text[language]} language={language} multiline
            showMissing={showMissing(`${base}.table.rows.${roll}.text.${language}`)} maxLength={LIMIT_TEXT}
            onChange={(value) => onChange((entry) => ({ ...entry, table: entry.table && { ...entry.table, rows: entry.table.rows.map((current, currentRoll) => currentRoll === roll ? { ...current, text: { ...current.text, [language]: value } } : current) } }))}
            onBlur={() => touch(`${base}.table.rows.${roll}.text.${language}`)}
          />
          <Select id={fieldId(`${base}.table.rows.${roll}.itemRef`)} value={row.itemRef ?? ""} onChange={(event) => onChange((entry) => ({ ...entry, table: entry.table && { ...entry.table, rows: entry.table.rows.map((current, currentRoll) => currentRoll === roll ? { ...current, itemRef: event.target.value || null } : current) } }))}>
            <option value="">{t("creator.items.nothing", "Nothing")}</option>
            {draft.items.map((item) => <option key={item.ref} value={item.ref} disabled={itemUsedElsewhere(item.ref, roll)}>{item.name[language] || t("creator.items.untitled", "Unnamed Class Item")}</option>)}
          </Select>
        </div>
      ))}
    </section>
  );
}
