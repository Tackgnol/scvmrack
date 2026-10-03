import type { ReactNode } from "react";
import type { ClassLanguage } from "@/api/classes";

export type LocalizedFieldProps = {
  id: string;
  label: string;
  value: string;
  language: ClassLanguage;
  multiline?: boolean;
  /** Marks the field invalid with "… text missing" when it is empty. */
  showMissing: boolean;
  maxLength: number;
  onChange: (value: string) => void;
  onBlur: () => void;
  /** A control at the right of the label row, e.g. Remove. */
  action?: ReactNode;
};
