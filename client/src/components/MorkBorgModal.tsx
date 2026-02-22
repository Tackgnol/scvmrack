import CloseIcon from '@mui/icons-material/Close';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  type ButtonProps,
  type DialogProps,
} from '@mui/material';
import type { ReactNode } from 'react';
import { customStyles } from '../theme/morkBorgTheme';

type ModalButtonVariant = 'primary' | 'secondary' | 'danger';
type DialogMaxWidth = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type ModalButtonProps = {
  variant?: ModalButtonVariant;
  children: ReactNode;
  onClick?: () => void;
};

export type MorkBorgModalProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  maxWidth?: DialogMaxWidth;
  fullWidth?: boolean;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
};

export default function MorkBorgModal({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = true,
  showCloseButton = true,
  closeOnBackdrop = true,
}: MorkBorgModalProps) {
  const handleClose: DialogProps['onClose'] = (_, reason) => {
    if (
      !closeOnBackdrop &&
      (reason === 'backdropClick' || reason === 'escapeKeyDown')
    ) {
      return;
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      PaperProps={{ sx: customStyles.morkBorgModal.dialogPaper }}
    >
      <DialogTitle sx={customStyles.morkBorgModal.dialogTitle}>
        {title}
        {showCloseButton && (
          <IconButton
            onClick={onClose}
            sx={customStyles.morkBorgModal.closeButton}
          >
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent sx={customStyles.morkBorgModal.dialogContent}>
        {children}
      </DialogContent>

      {actions && (
        <DialogActions
          sx={{
            ...customStyles.morkBorgModal.dialogActions,
            '& .MuiButton-root': {
              borderRadius: 0,
              fontFamily: "'Antonio', sans-serif",
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
            },
          }}
        >
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
