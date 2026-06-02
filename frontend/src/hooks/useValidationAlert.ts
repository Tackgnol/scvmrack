import { useEffect, useRef } from 'react';
import { useSnackbar } from '@/SnackbarContext/SnackbarProvider';

export function useValidationAlert(message?: string | null): void {
  const { showError } = useSnackbar();
  const shownMessageRef = useRef<string | null>(null);

  useEffect(() => {
    if (!message) {
      shownMessageRef.current = null;
      return;
    }

    if (shownMessageRef.current === message) return;
    shownMessageRef.current = message;
    showError(message);
  }, [message, showError]);
}
