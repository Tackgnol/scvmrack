import { DialogTitle } from '@mui/material';
import { type ReactNode } from 'react';
import { customStyles } from '@/theme/morkBorgTheme';
import ModalCloseButton from '@components/atoms/modal/ModalCloseButton';

interface MorkBorgModalHeaderProps {
  title: ReactNode;
  showCloseButton: boolean;
  onClose: () => void;
}

export default function MorkBorgModalHeader({
  title,
  showCloseButton,
  onClose,
}: MorkBorgModalHeaderProps) {
  return (
    <DialogTitle sx={customStyles.morkBorgModal.dialogTitle}>
      {title}
      {showCloseButton && <ModalCloseButton onClick={onClose} />}
    </DialogTitle>
  );
}
