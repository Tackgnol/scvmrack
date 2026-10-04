import type { SelectProps } from "./Select.models";
import { NativeSelect } from "./Select.styles";

/** A native select with the shared Mörk Borg field treatment. */
export function Select(props: SelectProps) {
  return <NativeSelect {...props} />;
}
