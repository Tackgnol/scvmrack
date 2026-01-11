import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  type ButtonProps,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { customStyles } from '../theme/morkBorgTheme';
import type { MorkBorgModalProps, ModalButtonProps } from '../types';

export default function MorkBorgModal({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'sm',
}: MorkBorgModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      PaperProps={{ sx: customStyles.morkBorgModal.dialogPaper }}
    >
      <DialogTitle sx={customStyles.morkBorgModal.dialogTitle}>
        {title}
        <IconButton onClick={onClose} sx={customStyles.morkBorgModal.closeButton}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={customStyles.morkBorgModal.dialogContent}>{children}</DialogContent>

      {actions && (
        <DialogActions sx={customStyles.morkBorgModal.dialogActions}>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
}

// Pre-styled button variants for modal actions
export function ModalButton({
  variant = 'primary',
  children,
  ...props
}: ModalButtonProps & Omit<ButtonProps, 'variant'>) {
  return (
    <Button sx={customStyles.modalButton[variant]} {...props}>
      {children}
    </Button>
  );
}
