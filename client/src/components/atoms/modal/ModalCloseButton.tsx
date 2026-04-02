import CloseIcon from '@mui/icons-material/Close';
import { IconButton } from '@mui/material';
import { customStyles } from '@/theme/morkBorgTheme';

interface ModalCloseButtonProps {
  onClick: () => void;
  ariaLabel?: string;
}

export default function ModalCloseButton({
  onClick,
  ariaLabel = 'Close modal',
}: ModalCloseButtonProps) {
  return (
    <IconButton
      onClick={onClick}
      sx={customStyles.morkBorgModal.closeButton}
      aria-label={ariaLabel}
    >
      <CloseIcon />
    </IconButton>
  );
}
