import { moveInRadioGroup } from "@/utils/radioGroupKeys";
import { Caption, Field } from "../field.styles";
import type { SegmentedChoiceProps } from "./SegmentedChoice.models";
import { Segment, Segments } from "./SegmentedChoice.styles";

/** A choice between a few options as segmented buttons (never a dropdown); a keyboard radio group. */
export function SegmentedChoice<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
}: SegmentedChoiceProps<T>) {
  const labelId = `${id}-label`;
  return (
    <Field>
      <Caption id={labelId}>{label}</Caption>
      <Segments
        id={id}
        role="radiogroup"
        aria-labelledby={labelId}
        onKeyDown={(event) => {
          const index = moveInRadioGroup(event);
          if (index !== null) onChange(options[index].value);
        }}
      >
        {options.map((option) => (
          <Segment
            key={option.value}
            id={`${id}-${option.value}`}
            type="button"
            role="radio"
            aria-checked={option.value === value}
            tabIndex={option.value === value ? 0 : -1}
            disabled={Boolean(option.disabledReason) && option.value !== value}
            title={option.disabledReason}
            aria-description={option.disabledReason}
            onClick={() => option.value !== value && onChange(option.value)}
          >
            {option.label}
          </Segment>
        ))}
      </Segments>
    </Field>
  );
}
