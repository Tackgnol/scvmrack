export type ObrRollPickerProps = {
  open: boolean;
  roomId: string;
  locale: string;
  onClose: () => void;
  onChoose: (classId: number | null, classless?: boolean) => void;
};
