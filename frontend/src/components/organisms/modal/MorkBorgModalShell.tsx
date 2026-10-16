import {
  Dialog,
  DialogContent,
  Fade,
  type DialogProps,
  type SxProps,
  type Theme,
} from '@mui/material';
import { customStyles } from '@/theme/morkBorgTheme';
import { useId } from 'react';
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
  const contentId = useId();

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      TransitionComponent={Fade}
      TransitionProps={{ timeout: transitionDuration }}
      PaperProps={{
        sx: paperSx,
        role: modalProps.role ?? "dialog",
        // An alertdialog must say what will happen, not only ask.
        "aria-describedby": modalProps.role === "alertdialog" ? contentId : undefined,
      }}
    >
      <MorkBorgModalHeader
        title={title}
        showCloseButton={showCloseButton}
        onClose={onClose}
      />

      <DialogContent id={contentId} sx={customStyles.morkBorgModal.dialogContent}>
        {children}
      </DialogContent>

      {actions && <MorkBorgModalActions actions={actions} />}
    </Dialog>
  );
}
