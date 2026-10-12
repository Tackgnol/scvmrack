import { LocalizedField } from "@/components/molecules/LocalizedField/LocalizedField";
import { useStableIds } from "@/hooks/useStableIds";
import { useTranslation } from "react-i18next";
import { Reorderable } from "../Reorderable/Reorderable";
import type { StepProps } from "../classCreator.models";
import { moveEntry } from "../reorder.utils";
import {
  Counter,
  Empty,
  InkButton,
  Hint,
  SmallAction,
  Spread,
  Stack,
} from "../classCreator.styles";
import {
  fieldId,
  LIMIT_LIST,
  LIMIT_TEXT,
  zineRows,
} from "../classCreator.utils";

/** Step 3: where this wretch came from; each scvm gets one at random. */
export function OriginsStep({
  draft,
  language,
  update,
  showMissing,
  touch,
  focus,
}: StepProps) {
  const { t } = useTranslation();
  const full = draft.origins.length >= LIMIT_LIST;
  const {
    ids,
    insert,
    remove: forget,
    move,
  } = useStableIds(draft.origins.length);
  const add = () => {
    insert(draft.origins.length);
    update((d) => ({ ...d, origins: [...d.origins, { en: "", pl: "" }] }));
    focus(`origins.${draft.origins.length}.${language}`);
  };
  const remove = (index: number) => {
    forget(index);
    update((d) => ({ ...d, origins: d.origins.filter((_, i) => i !== index) }));
    const remaining = draft.origins.length - 1;
    focus(
      remaining === 0
        ? "origins.add"
        : `origins.${Math.min(index, remaining - 1)}.${language}`,
    );
  };

  const reorder = (
    from: number,
    to: number,
    kind: "move" | "drag",
    source: string,
  ) => {
    move(from, to);
    update((d) => ({ ...d, origins: moveEntry(d.origins, from, to) }), {
      kind,
      source,
      label: t("creator.reorder.reorderedOrigins", "Reordered origins"),
    });
  };

  return (
    <Stack>
      <Hint>
        {t(
          "creator.zinePaste.origins",
          "Porting a zine? Paste one origin per line to add them all at once.",
        )}
      </Hint>
      <Hint>
        {t(
          "creator.reorder.originsHint",
          "Order is the numbered origin list used when a scvm is created.",
        )}
      </Hint>
      <Spread>
        <InkButton
          id={fieldId("origins.add")}
          type="button"
          disabled={full}
          title={
            full
              ? t(
                  "creator.origins.full",
                  "A class holds at most {{max}} origins.",
                  { max: LIMIT_LIST },
                )
              : undefined
          }
          onClick={add}
        >
          {t("creator.origins.add", "Add origin")}
        </InkButton>
        <Counter>
          {t("creator.origins.count", "{{count}} of {{max}} origins", {
            count: draft.origins.length,
            max: LIMIT_LIST,
          })}
        </Counter>
      </Spread>
      {draft.origins.length === 0 && (
        <Empty>
          {t(
            "creator.origins.empty",
            "No origins yet. Add the places this class’s wretches crawl out of.",
          )}
        </Empty>
      )}
      {draft.origins.map((origin, index) => {
        const path = `origins.${index}.${language}`;
        return (
          <Reorderable
            key={ids[index]}
            count={draft.origins.length}
            index={index}
            itemId={ids[index]}
            label={t("creator.origins.label", "Origin {{n}}", { n: index + 1 })}
            listId="origins"
            onMove={reorder}
          >
            <LocalizedField
              id={fieldId(path)}
              label={t("creator.origins.label", "Origin {{n}}", {
                n: index + 1,
              })}
              value={origin[language]}
              language={language}
              showMissing={showMissing(path)}
              maxLength={LIMIT_TEXT}
              onChange={(value) =>
                update((d) => ({
                  ...d,
                  origins: d.origins.map((o, i) =>
                    i === index ? { ...o, [language]: value } : o,
                  ),
                }))
              }
              onBlur={() => touch(path)}
              onPaste={(event) => {
                const rows = zineRows(
                  event.clipboardData.getData("text"),
                ).slice(0, LIMIT_LIST - index);
                if (rows.length < 2) {
                  return;
                }
                event.preventDefault();
                rows
                  .slice(1)
                  .forEach((_, offset) => insert(index + offset + 1));
                update(
                  (d) => ({
                    ...d,
                    origins: [
                      ...d.origins.slice(0, index),
                      ...rows.map((row, offset) => ({
                        ...(d.origins[index + offset] ?? { en: "", pl: "" }),
                        [language]: row,
                      })),
                      ...d.origins.slice(index + 1),
                    ],
                  }),
                  {
                    kind: "paste",
                    path,
                    label: t("creator.history.pastedOrigins", "Pasted origins"),
                  },
                );
              }}
              action={
                <SmallAction
                  type="button"
                  className="kill"
                  aria-label={t(
                    "creator.origins.removeLabel",
                    "Remove origin {{n}}",
                    { n: index + 1 },
                  )}
                  onClick={() => remove(index)}
                >
                  {t("creator.remove", "Remove")}
                </SmallAction>
              }
            />
          </Reorderable>
        );
      })}
    </Stack>
  );
}
