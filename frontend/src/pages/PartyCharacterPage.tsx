import { CharacterSheetSkeleton } from '@/components/molecules/character/CharacterSheetSkeleton';
import { usePartyDetail } from '@/hooks/usePartyRepository';
import { writeCharacter } from '@/api/characterCache';
import { appHistory } from '@/router/history';
import { buildCharacterPath } from '@/router/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { CharacterPage } from '@/pages/CharacterPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { getUserFacingApiErrorMessage, isApiNotFound } from '@/utils/errorUtils';
import { Alert, Box, Button, styled } from '@mui/material';
import { useEffect, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';

const subscribeToHistory = (onStoreChange: () => void): (() => void) =>
  appHistory.subscribe(() => onStoreChange());

const getPathnameSnapshot = () => appHistory.location?.pathname ?? '/';

const ErrorWrap = styled(Box)({
  paddingTop: 16,
  paddingBottom: 16,
});

function getPartyCharacterParams(pathname: string): {
  partyId: string;
  characterId: string;
} | null {
  const match = pathname.match(/^\/party\/([^/]+)\/character\/([^/]+)/);
  if (!match?.[1] || !match?.[2]) {
    return null;
  }

  return {
    partyId: decodeURIComponent(match[1]),
    characterId: decodeURIComponent(match[2]),
  };
}

export function PartyCharacterPage() {
  const { t, i18n } = useTranslation();
  const pathname = useSyncExternalStore(
    subscribeToHistory,
    getPathnameSnapshot,
    getPathnameSnapshot
  );
  const params = getPartyCharacterParams(pathname);
  const partyQuery = usePartyDetail(params?.partyId);

  const queryClient = useQueryClient();
  const member = partyQuery.data?.members.find(
    (candidate) => candidate.characterId === params?.characterId
  );
  // A scvm the GM kicked keeps its sheet at the plain URL; this party-scoped URL no longer applies.
  // A missing row only counts once the roster actually loaded (an offline first lookup is pending, not empty).
  const leftParty =
    Boolean(params) &&
    (partyQuery.error ? isApiNotFound(partyQuery.error) : partyQuery.isSuccess && !member);
  const characterId = params?.characterId ?? null;
  const partyId = params?.partyId ?? null;
  useEffect(() => {
    if (!leftParty || !characterId) {
      return;
    }
    // The plain sheet sends a scvm with a partyId back to its party: clear the cached one so the two URLs cannot bounce.
    // Only the party this URL names: a scvm that has since joined another party keeps that membership.
    writeCharacter(queryClient, characterId, i18n.language, (cached) =>
      cached && cached.partyId === partyId ? { ...cached, partyId: null } : cached
    );
    // Queued sheet edits must not hold this redirect: it stays on the same character.
    void appHistory.replace(buildCharacterPath(characterId), undefined, { ignoreBlocker: true });
  }, [leftParty, characterId, partyId, queryClient, i18n.language]);

  if (!params) {
    return <NotFoundPage seoNoIndex />;
  }

  if (partyQuery.isLoading || leftParty) {
    return <CharacterSheetSkeleton />;
  }

  if (partyQuery.error) {

    return (
      <ErrorWrap>
        <Alert
          severity="error"
          data-testid="party-character-error"
          action={
            <Button color="inherit" size="small" onClick={() => void partyQuery.refetch()}>
              {t('actions.retry', 'Retry')}
            </Button>
          }
        >
          {getUserFacingApiErrorMessage(partyQuery.error, t, 'Failed to load party')}
        </Alert>
      </ErrorWrap>
    );
  }

  if (!member) {
    return <CharacterSheetSkeleton />;
  }

  return <CharacterPage />;
}
