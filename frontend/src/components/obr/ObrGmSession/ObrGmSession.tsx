import { useState } from 'react';
import { Alert, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useObrSession } from '@/obr/useObrSession';

export function ObrGmSession() {
  const { isLoading, isAuthenticated, signIn, signInProgress } = useObrSession();
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function recover() {
    setBusy(true);
    setError(null);
    try {
      await signIn();
    } catch (cause) {
      setError(t(cause instanceof Error && cause.message === 'popup-blocked'
        ? 'obr.player.popupBlocked' : 'obr.player.signInFailed',
        ),
      );
    }
    setBusy(false);
  }

  if (isLoading || isAuthenticated) {
    return null;
  }

  return (
    <Alert severity="warning" action={
      <Button color="inherit" disabled={busy} onClick={() => void recover()}>
        {t('errors.signInAgain')}
      </Button>
    }>
      {error ?? t('obr.roster.signInForInvite')}
      {signInProgress?.code && (
        <span role="status">
          {t("obr.auth.comparison", { code: signInProgress.code })}
        </span>
      )}
    </Alert>
  );
}
