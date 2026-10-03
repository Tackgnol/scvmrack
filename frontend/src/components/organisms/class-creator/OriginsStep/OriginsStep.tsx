import { LocalizedField } from "@/components/molecules/LocalizedField/LocalizedField";
import { useStableIds } from "@/hooks/useStableIds";
import { useTranslation } from "react-i18next";
import type { StepProps } from "../classCreator.models";
import { Counter, Empty, InkButton, SmallAction, Spread, Stack } from "../classCreator.styles";
import { fieldId, LIMIT_LIST, LIMIT_TEXT } from "../classCreator.utils";

/** Step 3: where this wretch came from; each scvm gets one at random. */
export function OriginsStep({ draft, language, update, showMissing, touch, focus }: StepProps) {
  const { t } = useTranslation();
  const full = draft.origins.length >= LIMIT_LIST;
  const { ids, insert, remove: forget } = useStableIds(draft.origins.length);
  const add = () => {
    insert(draft.origins.length);
    update((d) => ({ ...d, origins: [...d.origins, { en: "", pl: "" }] }));
    focus(`origins.${draft.origins.length}.${language}`);
  };
  const remove = (index: number) => {
    forget(index);
    update((d) => ({ ...d, origins: d.origins.filter((_, i) => i !== index) }));
    const remaining = draft.origins.length - 1;
    focus(remaining === 0 ? "origins.add" : `origins.${Math.min(index, remaining - 1)}.${language}`);
  };

  return (
    <Stack>
      <Spread>
        <InkButton
          id={fieldId("origins.add")}
          type="button"
          disabled={full}
          title={full ? t("creator.origins.full", "A class holds at most {{max}} origins.", { max: LIMIT_LIST }) : undefined}
          onClick={add}
        >
          {t("creator.origins.add", "Add origin")}
        </InkButton>
        <Counter>
          {t("creator.origins.count", "{{count}} of {{max}} origins", { count: draft.origins.length, max: LIMIT_LIST })}
        </Counter>
      </Spread>
      {draft.origins.length === 0 && (
        <Empty>{t("creator.origins.empty", "No origins yet. Add the places this class’s wretches crawl out of.")}</Empty>
      )}
      {draft.origins.map((origin, index) => {
        const path = `origins.${index}.${language}`;
        return (
          <LocalizedField
            key={ids[index]}
            id={fieldId(path)}
            label={t("creator.origins.label", "Origin {{n}}", { n: index + 1 })}
            value={origin[language]}
            language={language}
            showMissing={showMissing(path)}
            maxLength={LIMIT_TEXT}
            onChange={(value) =>
              update((d) => ({
                ...d,
                origins: d.origins.map((o, i) => (i === index ? { ...o, [language]: value } : o)),
              }))
            }
            onBlur={() => touch(path)}
            action={
              <SmallAction
                type="button"
                className="kill"
                aria-label={t("creator.origins.removeLabel", "Remove origin {{n}}", { n: index + 1 })}
                onClick={() => remove(index)}
              >
                {t("creator.remove", "Remove")}
              </SmallAction>
            }
          />
        );
      })}
    </Stack>
  );
}
