import { DialogActions } from '@mui/material';
import { type ReactNode } from 'react';
import { customStyles } from '@/theme/morkBorgTheme';

interface MorkBorgModalActionsProps {
  actions: ReactNode;
}

export default function MorkBorgModalActions({
  actions,
}: MorkBorgModalActionsProps) {
  return (
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
  );
}
