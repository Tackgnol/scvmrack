export interface AbilityValueControlProps {
  value: number;
  label: string;
  onDecrease: () => void;
  onIncrease: () => void;
  onInputChange: (rawValue: string) => void;
  decreaseAriaLabel: string;
  increaseAriaLabel: string;
}
