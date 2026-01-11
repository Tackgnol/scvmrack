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
import { morkBorgColors } from '../theme/morkBorgTheme';
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
      PaperProps={{
        sx: {
          bgcolor: morkBorgColors.black,
          border: `4px solid ${morkBorgColors.yellow}`,
          boxShadow: `10px 10px 0 ${morkBorgColors.pink}`,
        },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: morkBorgColors.yellow,
          color: morkBorgColors.black,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pr: 1,
        }}
      >
        {title}
        <IconButton
          onClick={onClose}
          sx={{
            bgcolor: morkBorgColors.black,
            color: morkBorgColors.yellow,
            '&:hover': {
              bgcolor: morkBorgColors.pink,
              color: morkBorgColors.black,
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>{children}</DialogContent>

      {actions && (
        <DialogActions sx={{ p: 2, borderTop: `2px solid ${morkBorgColors.grey}` }}>
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
  const styles = {
    primary: {
      bgcolor: morkBorgColors.pink,
      color: morkBorgColors.black,
      '&:hover': { bgcolor: morkBorgColors.yellow },
    },
    secondary: {
      bgcolor: morkBorgColors.grey,
      color: morkBorgColors.white,
      border: `2px solid ${morkBorgColors.white}`,
      '&:hover': {
        bgcolor: morkBorgColors.white,
        color: morkBorgColors.black,
      },
    },
    danger: {
      bgcolor: '#8b0000',
      color: morkBorgColors.white,
      '&:hover': {
        bgcolor: morkBorgColors.pink,
        color: morkBorgColors.black,
      },
    },
  };

  return (
    <Button sx={styles[variant]} {...props}>
      {children}
    </Button>
  );
}
