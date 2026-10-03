export type DiePickerProps = {
  id: string;
  label: string;
  value: number;
  options: number[];
  onChange: (value: number) => void;
  hint?: string;
};
