import CloseIcon from '@mui/icons-material/Close';
import { IconButton } from '@mui/material';
import { customStyles } from '@/theme/morkBorgTheme';
import { useTranslation } from 'react-i18next';

interface ModalCloseButtonProps {
  onClick: () => void;
  ariaLabel?: string;
}

export default function ModalCloseButton({
  onClick,
  ariaLabel,
}: ModalCloseButtonProps) {
  const { t } = useTranslation();
  return (
    <IconButton
      onClick={onClick}
      sx={customStyles.morkBorgModal.closeButton}
      aria-label={ariaLabel ?? t('common.closeDialog', 'Close dialog')}
    >
      <CloseIcon />
    </IconButton>
  );
}
