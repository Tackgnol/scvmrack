import {
  Dialog,
  DialogContent,
  Fade,
  type DialogProps,
  type SxProps,
  type Theme,
} from '@mui/material';
import { customStyles } from '@/theme/morkBorgTheme';
import MorkBorgModalHeader from '@components/molecules/modal/MorkBorgModalHeader';
import MorkBorgModalActions from '@components/molecules/modal/MorkBorgModalActions';
import { type MorkBorgModalProps } from '@components/modal/types';

interface MorkBorgModalShellProps {
  modalProps: MorkBorgModalProps;
  handleClose: DialogProps['onClose'];
  transitionDuration: number;
  paperSx: SxProps<Theme>;
}

export default function MorkBorgModalShell({
  modalProps,
  handleClose,
  transitionDuration,
  paperSx,
}: MorkBorgModalShellProps) {
  const {
    open,
    onClose,
    title,
    children,
    actions,
    maxWidth = 'sm',
    fullWidth = true,
    showCloseButton = true,
  } = modalProps;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      TransitionComponent={Fade}
      TransitionProps={{ timeout: transitionDuration }}
      PaperProps={{ sx: paperSx }}
    >
      <MorkBorgModalHeader
        title={title}
        showCloseButton={showCloseButton}
        onClose={onClose}
      />

      <DialogContent sx={customStyles.morkBorgModal.dialogContent}>
        {children}
      </DialogContent>

      {actions && <MorkBorgModalActions actions={actions} />}
    </Dialog>
  );
}
