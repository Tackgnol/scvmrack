import { ensureAnonymousSession } from '@/auth';
import { joinParty } from '@/api/party';
import { ForgeFlow } from '@/components/organisms/character-create/ForgeFlow';
import type { CharacterResponse } from '@/hooks/models';
import { appHistory } from '@/router/history';
import { Seo } from '@/seo/Seo';
import { getUserFacingApiErrorMessage } from '@/utils/errorUtils';
import { partyColors, partyFonts } from '@/theme/partyTokens';
import { Alert, Box, Button, CircularProgress, styled } from '@mui/material';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';

const subscribeToHistory = (onStoreChange: () => void): (() => void) =>
  appHistory.subscribe(() => onStoreChange());

const getPathnameSnapshot = () => appHistory.location?.pathname ?? '/';

function getForgeToken(pathname: string): string | null {
  const match = pathname.match(/^\/join\/([^/]+)\/forge/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

const Center = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 16,
  paddingTop: 48,
  paddingBottom: 48,
  textAlign: 'center',
});

const Status = styled(Box)({
  fontFamily: partyFonts.label,
  color: partyColors.black,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  fontSize: '0.7rem',
});

const RetryButton = styled(Button)({
  backgroundColor: partyColors.pink,
  color: partyColors.black,
  border: `2px solid ${partyColors.yellow}`,
  borderRadius: 0,
  fontFamily: partyFonts.label,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  minHeight: 44,
  '&:hover': { backgroundColor: partyColors.yellow },
});

// "Forge a scvm and join this warband." A dedicated, single-purpose route: it
// first guarantees a session, then renders the normal forge UI, then on confirm
// binds the new scvm to the party and navigates. No cross-page token carry, no
// on-mount redemption effect — the whole flow lives here, imperatively.
export function JoinForgePage() {
  const { t } = useTranslation();
  const pathname = useSyncExternalStore(
    subscribeToHistory,
    getPathnameSnapshot,
    getPathnameSnapshot,
  );
  const token = getForgeToken(pathname);

  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  // After the scvm is created we still have to bind it. Track that tail so a
  // join failure can be retried without re-forging.
  const [stage, setStage] = useState<'forging' | 'joining' | 'join-failed'>('forging');
  const [joinError, setJoinError] = useState<string | null>(null);
  const createdIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSessionError(null);
    ensureAnonymousSession()
      .then(() => {
        if (!cancelled) setSessionReady(true);
      })
      .catch((error) => {
        if (!cancelled) {
          setSessionError(getUserFacingApiErrorMessage(error, t, 'Could not start a session'));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  const bind = async (characterId: string) => {
    if (!token) return;
    setStage('joining');
    setJoinError(null);
    try {
      const result = await joinParty({ token, characterId });
      await appHistory.push(result.redirect);
      appHistory.flush();
    } catch (error) {
      createdIdRef.current = characterId;
      setJoinError(getUserFacingApiErrorMessage(error, t, 'Failed to join party'));
      setStage('join-failed');
    }
  };

  const handleCreated = (character: CharacterResponse) => {
    if (character.id) {
      void bind(character.id);
    }
  };

  if (!token) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {t('party.invalidInvite', 'This invite link is no longer valid.')}
      </Alert>
    );
  }

  return (
    <>
      <Seo title="Forge and join" description="Forge a scvm and join a party." path={pathname} noIndex />

      {!sessionReady && !sessionError && (
        <Center>
          <CircularProgress sx={{ color: partyColors.pink }} />
          <Status>{t('party.preparingSession', 'Preparing your session…')}</Status>
        </Center>
      )}

      {sessionError && (
        <Center>
          <Alert severity="error">{sessionError}</Alert>
          <RetryButton onClick={() => appHistory.push(`/join/${token}`)}>
            {t('actions.back', 'Back')}
          </RetryButton>
        </Center>
      )}

      {sessionReady && stage === 'join-failed' && (
        <Center data-testid="join-forge-join-failed">
          <Alert severity="error">
            {joinError ??
              t('party.joinAfterForgeFailed', 'Your scvm was forged but could not join the warband.')}
          </Alert>
          <RetryButton
            onClick={() => createdIdRef.current && void bind(createdIdRef.current)}
          >
            {t('actions.retry', 'Retry')}
          </RetryButton>
        </Center>
      )}

      {sessionReady && stage === 'joining' && (
        <Center data-testid="join-forge-joining">
          <CircularProgress sx={{ color: partyColors.pink }} />
          <Status>{t('party.bindingToWarband', 'Binding to the warband…')}</Status>
        </Center>
      )}

      {sessionReady && stage === 'forging' && <ForgeFlow onCreated={handleCreated} />}
    </>
  );
}
