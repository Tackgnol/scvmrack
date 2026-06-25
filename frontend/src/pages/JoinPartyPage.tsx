import { fetchCharacterList } from '@/hooks/charactersListQuery';
import { useAuth } from '@/hooks/useAuth';
import {
  useJoinParty,
  useLeaveParty,
  usePartyInvite,
} from '@/hooks/usePartyRepository';
import { appHistory } from '@/router/history';
import { Seo } from '@/seo/Seo';
import { getUserFacingApiErrorMessage } from '@/utils/errorUtils';
import { partyColors, partyFonts } from '@/theme/partyTokens';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Typography,
  styled,
} from '@mui/material';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';

const subscribeToHistory = (onStoreChange: () => void): (() => void) =>
  appHistory.subscribe(() => onStoreChange());

const getPathnameSnapshot = () => appHistory.location?.pathname ?? '/';

function getJoinToken(pathname: string): string | null {
  const match = pathname.match(/^\/join\/([^/]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

async function goToSheet(partyId: string, characterId: string) {
  await appHistory.push(`/party/${partyId}/character/${characterId}`);
  appHistory.flush();
}

const Page = styled(Box)({
  paddingTop: 16,
  paddingBottom: 16,
  display: 'grid',
  gap: 16,
});

const Panel = styled(Box)(({ theme }) => ({
  backgroundColor: partyColors.black,
  color: partyColors.white,
  border: `3px solid ${partyColors.black}`,
  boxShadow: `7px 7px 0 ${partyColors.pink}`,
  padding: 16,
  [theme.breakpoints.up('sm')]: { padding: 20 },
  display: 'grid',
  gap: 12,
}));

const Title = styled(Typography)(({ theme }) => ({
  fontFamily: partyFonts.headline,
  color: partyColors.yellow,
  fontSize: '2.45rem',
  [theme.breakpoints.up('sm')]: { fontSize: '3.1rem' },
  letterSpacing: '0.04em',
  lineHeight: 0.95,
  margin: 0,
})) as typeof Typography;

const Body = styled(Typography)({
  color: partyColors.white,
  fontFamily: partyFonts.body,
  fontSize: '1rem',
  lineHeight: 1.45,
});

const WarbandStamp = styled(Box)({
  backgroundColor: partyColors.yellow,
  color: partyColors.black,
  border: `2px solid ${partyColors.black}`,
  padding: 10,
  display: 'grid',
  gap: 4,
});

const WarbandLabel = styled(Typography)({
  fontFamily: partyFonts.label,
  fontSize: '0.65rem',
  letterSpacing: '0.14em',
  lineHeight: 1,
  textTransform: 'uppercase',
});

const WarbandName = styled(Typography)({
  fontFamily: partyFonts.gothic,
  fontSize: '1.45rem',
  lineHeight: 1,
  overflowWrap: 'anywhere',
});

const JoinButton = styled(Button)({
  backgroundColor: partyColors.pink,
  color: partyColors.black,
  border: `2px solid ${partyColors.yellow}`,
  borderRadius: 0,
  fontFamily: partyFonts.label,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  minHeight: 44,
  '&:hover': { backgroundColor: partyColors.yellow },
}) as typeof Button;

const CenterRow = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  paddingTop: 16,
  paddingBottom: 16,
});

const Spinner = styled(CircularProgress)({
  color: partyColors.pink,
});

const ForgeRow = styled(Box)({
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
});

const CharacterList = styled(Box)({
  display: 'grid',
  gap: 8,
});

const CharacterRow = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr',
  [theme.breakpoints.up('sm')]: { gridTemplateColumns: 'minmax(0, 1fr) auto' },
  gap: 8,
  alignItems: 'center',
  backgroundColor: partyColors.yellow,
  color: partyColors.black,
  border: `2px solid ${partyColors.black}`,
  padding: 8,
}));

const Name = styled(Typography)({
  fontFamily: partyFonts.gothic,
  fontSize: '1.25rem',
  lineHeight: 1,
  overflowWrap: 'anywhere',
});

const Meta = styled(Typography)({
  marginTop: 4,
  fontFamily: partyFonts.label,
  fontSize: '0.62rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
});

export function JoinPartyPage() {
  const { t } = useTranslation();
  const { session, isLoading: authLoading } = useAuth({ bootstrapAnonymous: false });
  const pathname = useSyncExternalStore(
    subscribeToHistory,
    getPathnameSnapshot,
    getPathnameSnapshot
  );
  const token = getJoinToken(pathname);
  const joinMutation = useJoinParty();
  const leaveMutation = useLeaveParty();
  const {
    data: invite,
    error: inviteError,
    isLoading: inviteLoading,
  } = usePartyInvite(token);
  const [error, setError] = useState<string | null>(null);
  const {
    data: characters = [],
    error: charactersError,
    isLoading: charactersLoading,
  } = useQuery({
    queryKey: ['party', 'join', 'characters'],
    queryFn: ({ signal }) => fetchCharacterList(signal),
    enabled: Boolean(token) && !authLoading && Boolean(session?.user),
    retry: false,
  });

  const handleJoin = async (characterId: string) => {
    if (!token) {
      return;
    }

    setError(null);
    try {
      const result = await joinMutation.mutateAsync({ token, characterId });
      await appHistory.push(result.redirect);
      appHistory.flush();
    } catch (joinError) {
      setError(getUserFacingApiErrorMessage(joinError, t, 'Failed to join party'));
    }
  };

  const handleLeave = async (partyId: string, characterId: string) => {
    setError(null);
    try {
      await leaveMutation.mutateAsync({ partyId, characterId });
    } catch (leaveError) {
      setError(getUserFacingApiErrorMessage(leaveError, t, 'Failed to leave party'));
    }
  };

  const visibleError =
    error ??
    (inviteError
      ? getUserFacingApiErrorMessage(inviteError, t, 'Failed to load party invite')
      : charactersError
        ? getUserFacingApiErrorMessage(charactersError, t, 'Failed to load characters')
        : null);

  if (!token) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {t('party.invalidInvite', 'This invite link is no longer valid.')}
      </Alert>
    );
  }

  return (
    <>
      <Seo
        title="Join Party"
        description="Join a Scvm Rack party."
        path={`/join/${token}`}
        noIndex
      />

      <Page>
        <Panel>
          <Title component="h1">{t('party.joinTitle', 'Join the warband')}</Title>
          <Body>
            {t(
              'party.joinBody',
              'Pick a scvm from this session or forge a fresh one for the table.'
            )}
          </Body>

          {invite && (
            <WarbandStamp data-testid="join-warband-name">
              <WarbandLabel>{t('party.joinWarbandLabel', 'Warband')}</WarbandLabel>
              <WarbandName>{invite.name}</WarbandName>
            </WarbandStamp>
          )}

          {(inviteLoading || authLoading || charactersLoading) && (
            <CenterRow>
              <Spinner />
            </CenterRow>
          )}

          {visibleError && <Alert severity="error">{visibleError}</Alert>}

          {invite && (
            <CharacterList>
              {characters.map((character) => {
                const characterName =
                  character.name || t('character.unnamedWretch', 'Unnamed wretch');
                const isInInviteWarband = character.partyId === invite.id;

                return (
                  <CharacterRow key={character.id}>
                    <Box>
                      <Name>{characterName}</Name>
                      <Meta>
                        {isInInviteWarband
                          ? t(
                              'party.alreadyInThisWarband',
                              '{{name}} is already in this warband',
                              { name: characterName }
                            )
                          : character.partyId
                            ? t('party.alreadyInParty', 'Already in a party')
                            : t('party.readyToJoin', 'Ready to join')}
                      </Meta>
                    </Box>
                    {isInInviteWarband ? (
                      <JoinButton
                        onClick={() =>
                          void goToSheet(invite.id, character.id)
                        }
                      >
                        {t('party.goToSheet', 'Go to sheet')}
                      </JoinButton>
                    ) : character.partyId ? (
                      <JoinButton
                        disabled={leaveMutation.isPending}
                        onClick={() =>
                          void handleLeave(character.partyId!, character.id)
                        }
                      >
                        {leaveMutation.isPending
                          ? t('party.leaving', 'Leaving...')
                          : t('party.leaveParty', 'Leave party')}
                      </JoinButton>
                    ) : (
                      <JoinButton
                        disabled={joinMutation.isPending}
                        onClick={() => void handleJoin(character.id)}
                      >
                        {joinMutation.isPending
                          ? t('party.joining', 'Joining...')
                          : t('party.joinCta', 'Join party')}
                      </JoinButton>
                    )}
                  </CharacterRow>
                );
              })}
            </CharacterList>
          )}

          {/* Always offer a fresh scvm — a player whose only character is bound
              elsewhere can still roll/forge a new one for this table. */}
          {invite && !charactersLoading && (
            <ForgeRow>
              <JoinButton component={Link} to={`/join/${token}/forge`}>
                {t('create.entry', 'Forge a Scvm')}
              </JoinButton>
              <JoinButton component={Link} to={`/join/${token}/roll`}>
                {t('party.rollAndJoin', 'Roll and join')}
              </JoinButton>
            </ForgeRow>
          )}
        </Panel>
      </Page>
    </>
  );
}
