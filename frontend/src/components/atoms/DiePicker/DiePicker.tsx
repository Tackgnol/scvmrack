import { Caption, Field, Hint } from "../field.styles";
import { moveInRadioGroup } from "@/utils/radioGroupKeys";
import type { DiePickerProps } from "./DiePicker.models";
import { Die, Group } from "./DiePicker.styles";

/** A row of die buttons (d4…d12), one chosen and stamped yellow; a keyboard radio group. */
export function DiePicker({ id, label, value, options, onChange, hint }: DiePickerProps) {
  const labelId = `${id}-label`;
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <Field>
      <Caption id={labelId}>{label}</Caption>
      <Group
        id={id}
        role="radiogroup"
        aria-labelledby={labelId}
        aria-describedby={hintId}
        onKeyDown={(event) => {
          const index = moveInRadioGroup(event);
          if (index !== null) {
            onChange(options[index]);
          }
        }}
      >
        {options.map((faces) => (
          <Die
            key={faces}
            type="button"
            role="radio"
            aria-checked={faces === value}
            tabIndex={faces === value ? 0 : -1}
            onClick={() => faces !== value && onChange(faces)}
          >
            d{faces}
          </Die>
        ))}
      </Group>
      {hint && <Hint id={hintId}>{hint}</Hint>}
    </Field>
  );
}
