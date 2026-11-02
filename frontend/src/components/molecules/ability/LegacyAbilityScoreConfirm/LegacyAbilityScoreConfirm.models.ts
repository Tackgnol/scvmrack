export interface LegacyAbilityScoreConfirmProps {
  label: string;
  fromScore: number;
  toScore: number;
  onCancel: () => void;
  onConfirm: () => void;
}
