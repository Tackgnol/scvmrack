import { ensureAnonymousSession } from '@/auth';
import { createRandomCharacter } from '@/api/draft';
import { joinParty } from '@/api/party';
import { appHistory } from '@/router/history';
import { Seo } from '@/seo/Seo';
import { getUserFacingApiErrorMessage } from '@/utils/errorUtils';
import { partyColors, partyFonts } from '@/theme/partyTokens';
import { Alert, Box, Button, CircularProgress, styled } from '@mui/material';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';

const subscribeToHistory = (onStoreChange: () => void): (() => void) =>
  appHistory.subscribe(() => onStoreChange());

const getPathnameSnapshot = () => appHistory.location?.pathname ?? '/';

function getRollToken(pathname: string): string | null {
  const match = pathname.match(/^\/join\/([^/]+)\/roll/);
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

// "Roll a random scvm and join." One imperative sequence: ensure a session,
// roll a character, bind it to the party, navigate. A created-but-unbound scvm
// is remembered so a retry rebinds it instead of rolling a fresh one.
export function JoinRollPage() {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language ?? 'en').split('-')[0];
  const pathname = useSyncExternalStore(
    subscribeToHistory,
    getPathnameSnapshot,
    getPathnameSnapshot,
  );
  const token = getRollToken(pathname);

  const [error, setError] = useState<string | null>(null);
  const createdIdRef = useRef<string | null>(null);
  const runningRef = useRef(false);

  const run = useCallback(async () => {
    if (!token || runningRef.current) return;
    runningRef.current = true;
    setError(null);
    try {
      await ensureAnonymousSession();
      if (!createdIdRef.current) {
        const character = await createRandomCharacter(locale);
        createdIdRef.current = character.id ?? null;
      }
      if (!createdIdRef.current) {
        throw new Error('Roll did not return a character');
      }
      const result = await joinParty({ token, characterId: createdIdRef.current });
      await appHistory.push(result.redirect);
      appHistory.flush();
    } catch (e) {
      setError(getUserFacingApiErrorMessage(e, t, 'Failed to roll and join'));
    } finally {
      runningRef.current = false;
    }
  }, [token, locale, t]);

  useEffect(() => {
    void run();
  }, [run]);

  if (!token) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {t('party.invalidInvite', 'This invite link is no longer valid.')}
      </Alert>
    );
  }

  return (
    <>
      <Seo title="Roll and join" description="Roll a scvm and join a party." path={pathname} noIndex />

      {error ? (
        <Center data-testid="join-roll-failed">
          <Alert severity="error">{error}</Alert>
          <RetryButton onClick={() => void run()}>{t('actions.retry', 'Retry')}</RetryButton>
        </Center>
      ) : (
        <Center data-testid="join-roll-working">
          <CircularProgress sx={{ color: partyColors.pink }} />
          <Status>{t('party.rollingAndJoining', 'Rolling a scvm and joining…')}</Status>
        </Center>
      )}
    </>
  );
}
