import CloseIcon from '@mui/icons-material/Close';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fade,
  IconButton,
  useMediaQuery,
  type ButtonProps,
  type DialogProps,
} from '@mui/material';
import type { ReactNode } from 'react';
import { keyframes } from '@mui/system';
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

const modalEnter = keyframes`
  0% { transform: translateY(10px) scale(0.96) rotate(-0.6deg); box-shadow: 6px 6px 0 rgba(255, 62, 181, 0.2); }
  60% { transform: translateY(0) scale(1.02) rotate(0deg); box-shadow: 12px 12px 0 rgba(255, 62, 181, 0.6); }
  100% { transform: translateY(0) scale(1) rotate(0deg); box-shadow: 10px 10px 0 rgba(255, 62, 181, 0.9); }
`;

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
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const handleClose: DialogProps['onClose'] = (_, reason) => {
    if (
      !closeOnBackdrop &&
      (reason === 'backdropClick' || reason === 'escapeKeyDown')
    ) {
      return;
    }
    onClose();
  };

  const transitionDuration = prefersReducedMotion ? 0 : 260;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      TransitionComponent={Fade}
      TransitionProps={{ timeout: transitionDuration }}
      PaperProps={{
        sx: {
          ...customStyles.morkBorgModal.dialogPaper,
          transformOrigin: 'top center',
          animation: prefersReducedMotion
            ? 'none'
            : `${modalEnter} 320ms cubic-bezier(0.22, 1, 0.36, 1)`,
        },
      }}
    >
      <DialogTitle sx={customStyles.morkBorgModal.dialogTitle}>
        {title}
        {showCloseButton && (
          <IconButton
            onClick={onClose}
            sx={customStyles.morkBorgModal.closeButton}
            aria-label="Close modal"
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
