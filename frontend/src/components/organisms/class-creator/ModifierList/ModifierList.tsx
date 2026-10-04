import { useStableIds } from "@/hooks/useStableIds";
import { ModifierRow } from "../ModifierRow/ModifierRow";
import { GroupHeading, Stack } from "../classCreator.styles";
import type { ModifierListProps } from "./ModifierList.models";

/** The modifiers an ability or Class Item carries, each editable and removable; nothing when empty. */
export function ModifierList({ path, title, modifiers, onChange, focus, focusAfterRemove }: ModifierListProps) {
  const { ids, remove } = useStableIds(modifiers.length);
  if (modifiers.length === 0) return null;
  return (
    <Stack>
      <GroupHeading>{title}</GroupHeading>
      {modifiers.map((modifier, m) => (
        <ModifierRow
          key={ids[m]}
          path={`${path}.${m}`}
          index={m}
          modifier={modifier}
          onChange={(next) => onChange(modifiers.map((old, i) => (i === m ? next : old)))}
          onRemove={() => {
            remove(m);
            onChange(modifiers.filter((_, i) => i !== m));
            focus(modifiers.length > 1 ? `${path}.${Math.max(0, m - 1)}.statistic` : focusAfterRemove);
          }}
        />
      ))}
    </Stack>
  );
}
