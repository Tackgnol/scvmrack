import { useAuth } from '@/hooks/useAuth';
import { useCreateParty, usePartyList } from '@/hooks/usePartyRepository';
import { appHistory } from '@/router/history';
import { Seo } from '@/seo/Seo';
import { customStyles } from '@/theme/morkBorgTheme';
import { getUserFacingApiErrorMessage } from '@/utils/errorUtils';
import { PartyCreateForm } from '@/components/organisms/party/PartyCreateForm';
import {
  CenterRow,
  EmptyText,
  Meta,
  Page,
  PartyActionButton,
  PartyCard,
  PartyGrid,
  PartyName,
  Spinner,
  Stamp,
  Title,
} from '@/pages/GmOverviewPage.styles';
import {
  Alert,
  Box,
  Button,
} from '@mui/material';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export function GmOverviewPage() {
  const { t } = useTranslation();
  const { isAuthenticated, isGuest, isLoading: authLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const partiesQuery = usePartyList(isAuthenticated);
  const createMutation = useCreateParty();

  const handleCreate = async (name: string): Promise<boolean> => {
    if (createMutation.isPending) {
      return false;
    }

    setError(null);
    try {
      const party = await createMutation.mutateAsync(
        name || t('party.defaultName', 'Untitled Warband')
      );
      await appHistory.push(`/party/${party.id}`);
      appHistory.flush();
      return true;
    } catch (createError) {
      setError(getUserFacingApiErrorMessage(createError, t, 'Failed to create party'));
      return false;
    }
  };

  if (isGuest) {
    return (
      <>
        <Seo
          title="GM Dashboard"
          description="Private game-master party dashboard."
          path="/gm"
          noIndex
        />
        <Box sx={{ py: 4 }}>
          <Alert data-testid="gm-guest-warning" severity="warning" sx={customStyles.alerts.warning}>
            {t('gm.loginRequired', 'You need to be logged in to run the GM dashboard.')}
          </Alert>
          <Button component={Link} to="/" variant="contained" sx={customStyles.charactersListPage.loginButton}>
            {t('common.backToHome', 'Back to Home')}
          </Button>
        </Box>
      </>
    );
  }

  return (
    <>
      <Seo
        title="GM Dashboard"
        description="Private game-master party dashboard."
        path="/gm"
        noIndex
      />

      <Page>
        <Stamp>{t('gm.stamp', 'Game Master')}</Stamp>
        <Title component="h1">{t('gm.dashboardTitle', 'Party control')}</Title>

        <PartyCreateForm
          isAuthLoading={authLoading}
          isCreating={createMutation.isPending}
          onCreate={handleCreate}
        />

        {error && <Alert severity="error">{error}</Alert>}

        {partiesQuery.isLoading && (
          <CenterRow data-testid="gm-loading">
            <Spinner />
          </CenterRow>
        )}

        {partiesQuery.error && (
          <Alert
            data-testid="gm-error"
            severity="error"
            sx={{ mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={() => partiesQuery.refetch()}>
                {t('actions.retry', 'Retry')}
              </Button>
            }
          >
            {getUserFacingApiErrorMessage(
              partiesQuery.error,
              t,
              'The party list failed to load.'
            )}
          </Alert>
        )}

        {!partiesQuery.isLoading && !partiesQuery.error && (partiesQuery.data ?? []).length === 0 && (
          <EmptyText data-testid="gm-empty">
            {t('gm.emptyParties', 'No parties yet. Create one and hand the link to your doomed table.')}
          </EmptyText>
        )}

        <PartyGrid>
          {(partiesQuery.data ?? []).map((party) => (
            <PartyCard key={party.id}>
              <Box>
                <PartyName>{party.name}</PartyName>
                <Meta>
                  {t('gm.partyCardMeta', '{{count}}/{{max}} scvms', {
                    count: party.memberCount,
                    max: party.maxMembers,
                  })}
                </Meta>
              </Box>
              <PartyActionButton component={Link} to={`/party/${party.id}`}>
                {t('gm.manageParty', 'Manage')}
              </PartyActionButton>
            </PartyCard>
          ))}
        </PartyGrid>
      </Page>
    </>
  );
}
