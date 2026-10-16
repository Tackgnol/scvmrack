export type NumberStepperProps = {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  /** Show a sign (+1, −1), for values that can go below zero. */
  signedValue?: boolean;
  hint?: string;
  /** Arrow keys leave the value alone; typed values commit on Enter or blur. */
  commitOnEnterOnly?: boolean;
};
