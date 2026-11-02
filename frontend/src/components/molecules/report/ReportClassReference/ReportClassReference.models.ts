import type { TextFieldProps } from "@mui/material";

export type ReportClassReferenceProps = Pick<
  TextFieldProps,
  "value" | "onChange" | "onBlur" | "inputRef" | "name" | "disabled"
> & {
  reportedClassName?: string;
  editing: boolean;
  malformed: boolean;
  onEdit: () => void;
};
