import { CharacterSheetSkeleton } from '@/components/molecules/character/CharacterSheetSkeleton';
import { usePartyDetail } from '@/hooks/usePartyRepository';
import { appHistory } from '@/router/history';
import { CharacterPage } from '@/pages/CharacterPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { getUserFacingApiErrorMessage, isApiNotFound } from '@/utils/errorUtils';
import { Alert, Box, Button, styled } from '@mui/material';
import { useSyncExternalStore } from 'react';
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

  if (!params) {
    return <NotFoundPage seoNoIndex />;
  }

  if (partyQuery.isLoading) {
    return <CharacterSheetSkeleton />;
  }

  if (partyQuery.error) {
    if (isApiNotFound(partyQuery.error)) {
      return <NotFoundPage seoNoIndex />;
    }

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

  const member = partyQuery.data?.members.find(
    (candidate) => candidate.characterId === params.characterId
  );
  if (!member) {
    return <NotFoundPage seoNoIndex />;
  }

  return <CharacterPage />;
}
