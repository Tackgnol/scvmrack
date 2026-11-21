import { CharacterSheetSkeleton } from '@/components/molecules/character/CharacterSheetSkeleton';
import { usePartyDetail } from '@/hooks/usePartyRepository';
import { appHistory } from '@/router/history';
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
  const { t } = useTranslation();
  const pathname = useSyncExternalStore(
    subscribeToHistory,
    getPathnameSnapshot,
    getPathnameSnapshot
  );
  const params = getPartyCharacterParams(pathname);
  const partyQuery = usePartyDetail(params?.partyId);

  const member = partyQuery.data?.members.find(
    (candidate) => candidate.characterId === params?.characterId
  );
  // A scvm the GM kicked keeps its sheet at the plain URL; this party-scoped URL no longer applies.
  const leftParty =
    Boolean(params) &&
    !partyQuery.isLoading &&
    (partyQuery.error ? isApiNotFound(partyQuery.error) : !member && !partyQuery.isFetching);
  const plainSheetPath = params ? `/character/${encodeURIComponent(params.characterId)}` : null;
  useEffect(() => {
    if (leftParty && plainSheetPath) {
      void appHistory.replace(plainSheetPath);
    }
  }, [leftParty, plainSheetPath]);

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
