import ModalButtonAtom from '@components/atoms/modal/ModalButton';
import MorkBorgModalShell from '@components/organisms/modal/MorkBorgModalShell';
import { useMorkBorgModal } from '@/hooks/useMorkBorgModal';
import { type MorkBorgModalProps, type ModalActionButtonProps } from '@components/modal/types';

export type { MorkBorgModalProps } from '@components/modal/types';

export default function MorkBorgModal(props: MorkBorgModalProps) {
  const { closeOnBackdrop = true, onClose } = props;
  const { handleClose, transitionDuration, paperSx } = useMorkBorgModal({
    closeOnBackdrop,
    onClose,
  });

  return (
    <MorkBorgModalShell
      modalProps={props}
      handleClose={handleClose}
      transitionDuration={transitionDuration}
      paperSx={paperSx}
    />
  );
}

// Backward-compatible named export used across the app.
export function ModalButton(props: ModalActionButtonProps) {
  return <ModalButtonAtom {...props} />;
}
