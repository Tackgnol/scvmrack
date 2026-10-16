import type { AbilityDraft } from "@/api/classes";
import { NumberStepper } from "@/components/atoms/NumberStepper/NumberStepper";
import { Select } from "@/components/atoms/Select/Select";
import { LocalizedField } from "@/components/molecules/LocalizedField/LocalizedField";
import { useRef, useState } from "react";
import { useStableIds } from "@/hooks/useStableIds";
import { useTranslation } from "react-i18next";
import { fieldId, LIMIT_TEXT, TABLE_DICE } from "../creatorShared.utils";
import { Reorderable } from "../Reorderable/Reorderable";
import { moveEntry } from "../reorder.utils";
import { RemoveConfirm } from "../RemoveConfirm/RemoveConfirm";
import { SmallAction } from "../creatorShared.styles";
import type { AbilityReferenceTableEditorProps } from "./AbilityReferenceTableEditor.models";

type PendingPaste = { roll: number; lines: string[] };

const emptyRow = () => ({ text: { en: "", pl: "" }, itemRef: null });

function pastedRows(value: string): string[] {
  const rows = value.split(/\r?\n/).map((line) => line.replace(/^\s*(?:\d+\s*(?:[.):]|-)|[-*•])\s*/, "").trim()).filter(Boolean);
  return /^d(?:2|3|4|6|8|10|12)\b/i.test(rows[0] ?? "") ? rows.slice(1) : rows;
}

/** Edits one ability’s optional dN reference table and its Class Item row links. */
export function AbilityReferenceTableEditor({ ability, base, draft, index, language, onChange, showMissing, touch }: AbilityReferenceTableEditorProps) {
  const { t } = useTranslation();
  const parkedRows = useRef<NonNullable<AbilityDraft["table"]>["rows"]>([]);
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);
  const [pendingPaste, setPendingPaste] = useState<PendingPaste | null>(null);
  const table = ability.table;
  const { ids, move } = useStableIds(table?.rows.length ?? 0);
  const itemUsedElsewhere = (ref: string, row: number) => draft.abilities.some((candidate, abilityIndex) =>
    candidate.grantItem === ref || candidate.grantPet === ref || candidate.table?.rows.some((entry, rowIndex) => entry.itemRef === ref && (abilityIndex !== index || rowIndex !== row)),
  );
  if (!table) {
    return <SmallAction id={fieldId(`${base}.addTable`)} type="button" onClick={() => onChange((entry) => ({ ...entry, table: { die: 6, rows: Array.from({ length: 6 }, emptyRow) } }))}>{t("creator.abilities.addTable", "Add reference table")}</SmallAction>;
  }
  const linkedItemNames = table.rows.flatMap((row) => {
    const item = draft.items.find((candidate) => candidate.ref === row.itemRef);
    return item ? [item.name[language] || t("creator.items.untitled", "Unnamed Class Item")] : [];
  });
  const resize = (die: number) => {
    const nextDie = (die < table.die ? [...TABLE_DICE].reverse().find((candidate) => candidate <= die) : TABLE_DICE.find((candidate) => candidate >= die)) ?? table.die;
    const kept = table.rows.slice(0, nextDie);
    if (nextDie < table.die) {
      parkedRows.current = [...table.rows.slice(nextDie), ...parkedRows.current];
    }
    const restored = nextDie > table.die ? parkedRows.current.slice(0, nextDie - kept.length) : [];
    if (restored.length > 0) {
      parkedRows.current = parkedRows.current.slice(restored.length);
    }
    const rows = [...kept, ...restored];
    while (rows.length < nextDie) {
      rows.push(emptyRow());
    }
    onChange((entry) => ({ ...entry, table: { die: nextDie, rows } }));
  };
  const applyPaste = () => {
    if (!pendingPaste) {
      return;
    }
    const neededRows = pendingPaste.roll + pendingPaste.lines.length;
    const die = TABLE_DICE.find((candidate) => candidate >= neededRows) ?? 12;
    onChange((entry) => {
      if (!entry.table) {
        return entry;
      }
      const rows = [...entry.table.rows];
      while (rows.length < die) {
        rows.push(emptyRow());
      }
      pendingPaste.lines.forEach((text, offset) => {
        const row = pendingPaste.roll + offset;
        rows[row] = { ...rows[row], text: { ...rows[row].text, [language]: text } };
      });
      return { ...entry, table: { die: Math.max(entry.table.die, die) as typeof entry.table.die, rows } };
    });
    setPendingPaste(null);
  };
  const reorderRows = (from: number, to: number) => {
    move(from, to);
    onChange((entry) => entry.table ? { ...entry, table: { ...entry.table, rows: moveEntry(entry.table.rows, from, to) } } : entry);
  };

  return (
    <section aria-label={t("creator.abilities.referenceTable", "Reference table")}>
      {confirmingRemoval && <RemoveConfirm message={t("creator.abilities.removeTableWithItems", "This table gives {{items}}. Remove the table and its links?", { items: linkedItemNames.map((name) => `“${name}”`).join(", ") })} actions={[{ label: t("creator.abilities.removeTable", "Remove reference table"), danger: true, onClick: () => onChange((entry) => ({ ...entry, table: null })) }, { label: t("creator.cancel", "Cancel"), onClick: () => setConfirmingRemoval(false) }]} />}
      {pendingPaste && <RemoveConfirm message={t("creator.abilities.pasteTableRows", "Replace {{count}} table rows? Paste the other language separately.", { count: pendingPaste.lines.length })} actions={[{ label: t("creator.abilities.replaceRows", "Replace rows"), onClick: applyPaste }, { label: t("creator.cancel", "Cancel"), onClick: () => setPendingPaste(null) }]} />}
      {!confirmingRemoval && !pendingPaste && <SmallAction type="button" className="kill" onClick={() => linkedItemNames.length > 0 ? setConfirmingRemoval(true) : onChange((entry) => ({ ...entry, table: null }))}>{t("creator.abilities.removeTable", "Remove reference table")}</SmallAction>}
      <NumberStepper id={fieldId(`${base}.table.die`)} label={t("creator.abilities.tableDie", "Table die")} value={table.die} min={2} max={12} onChange={resize} commitOnEnterOnly hint={t("creator.abilities.tableHint", "The row number is the die result.")} />
      {table.rows.map((row, roll) => (
        <Reorderable
          key={ids[roll]}
          count={table.rows.length}
          index={roll}
          itemId={ids[roll]}
          label={t("creator.abilities.tableRow", "Result {{roll}}", { roll: roll + 1 })}
          listId={`${base}-table`}
          onMove={reorderRows}
        >
          <div>
            <LocalizedField
              id={fieldId(`${base}.table.rows.${roll}.text.${language}`)}
              label={t("creator.abilities.tableRow", "Result {{roll}}", { roll: roll + 1 })}
              value={row.text[language]}
              language={language}
              multiline
              showMissing={showMissing(`${base}.table.rows.${roll}.text.${language}`)}
              maxLength={LIMIT_TEXT}
              onChange={(value) => onChange((entry) => ({ ...entry, table: entry.table && { ...entry.table, rows: entry.table.rows.map((current, currentRoll) => currentRoll === roll ? { ...current, text: { ...current.text, [language]: value } } : current) } }))}
              onBlur={() => touch(`${base}.table.rows.${roll}.text.${language}`)}
              onPaste={(event) => { const lines = pastedRows(event.clipboardData.getData("text")); if (lines.length < 2) {
                return;
              } event.preventDefault(); setPendingPaste({ roll, lines: lines.slice(0, 12 - roll) }); }}
            />
            <Select id={fieldId(`${base}.table.rows.${roll}.itemRef`)} value={row.itemRef ?? ""} onChange={(event) => onChange((entry) => ({ ...entry, table: entry.table && { ...entry.table, rows: entry.table.rows.map((current, currentRoll) => currentRoll === roll ? { ...current, itemRef: event.target.value || null } : current) } }))}>
              <option value="">{t("creator.items.nothing", "Nothing")}</option>
              {draft.items.map((item) => <option key={item.ref} value={item.ref} disabled={itemUsedElsewhere(item.ref, roll)}>{item.name[language] || t("creator.items.untitled", "Unnamed Class Item")}</option>)}
            </Select>
          </div>
        </Reorderable>
      ))}
    </section>
  );
}
