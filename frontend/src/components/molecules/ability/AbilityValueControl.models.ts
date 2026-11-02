export interface AbilityValueControlProps {
  value: number;
  label: string;
  onDecrease: () => boolean | void;
  onIncrease: () => boolean | void;
  onInputChange: (rawValue: string) => void;
  decreaseAriaLabel: string;
  increaseAriaLabel: string;
}
