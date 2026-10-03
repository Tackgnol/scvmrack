export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  /** Why it can't be chosen, in words a GM uses; set disables the option. */
  disabledReason?: string;
};

export type SegmentedChoiceProps<T extends string> = {
  id: string;
  label: string;
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
};
