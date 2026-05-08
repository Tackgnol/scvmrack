import { useMemo } from 'react';
import { useMediaQuery, type DialogProps } from '@mui/material';
import { customStyles } from '@/theme/morkBorgTheme';
import { modalEnter } from '@components/modal/motion';

interface UseMorkBorgModalParams {
  closeOnBackdrop: boolean;
  onClose: () => void;
}

export function useMorkBorgModal({
  closeOnBackdrop,
  onClose,
}: UseMorkBorgModalParams) {
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

  const paperSx = useMemo(
    () => ({
      ...customStyles.morkBorgModal.dialogPaper,
      transformOrigin: 'top center',
      animation: prefersReducedMotion
        ? 'none'
        : `${modalEnter} 320ms cubic-bezier(0.22, 1, 0.36, 1)`,
    }),
    [prefersReducedMotion],
  );

  return {
    handleClose,
    transitionDuration,
    paperSx,
  };
}
