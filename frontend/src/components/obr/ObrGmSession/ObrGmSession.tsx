import { useState } from 'react';
import { Alert, Button } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import OBR from '@owlbear-rodeo/sdk';
import { partyKeys } from '@/api/party';
import { useObrSession } from '@/obr/useObrSession';

export function ObrGmSession() {
  const { isLoading, isAuthenticated, signIn } = useObrSession();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function recover() {
    setBusy(true);
    setError(null);
    try {
      await signIn();
      // The same owner's expired session can leave a token-less party cached.
      await queryClient.invalidateQueries({ queryKey: partyKeys.obrRoom(OBR.room.id) });
    } catch (cause) {
      setError(t(cause instanceof Error && cause.message === 'popup-blocked'
        ? 'obr.player.popupBlocked' : 'obr.player.signInFailed'));
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
    </Alert>
  );
}
