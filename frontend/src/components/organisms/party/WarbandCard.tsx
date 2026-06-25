import { partyColors, partyFonts } from '@/theme/partyTokens';
import { WarbandCardView } from '@/components/organisms/party/WarbandCardView';
import { useWarbandMember } from '@/hooks/useWarbandMember';
import { Box, Skeleton, styled } from '@mui/material';
import { useTranslation } from 'react-i18next';

type WarbandCardProps = {
  id: string;
  name: string;
  /** Only fetch while the takeover is actually open. */
  active: boolean;
};

const Shell = styled(Box)({
  width: '100%',
  height: '100%',
  background: partyColors.black,
  border: `1px solid ${partyColors.grey}`,
  boxShadow: '6px 6px 0 rgba(10,10,10,0.28)',
  display: 'flex',
  flexDirection: 'column',
  padding: '16px',
});

const LoadingShell = styled(Shell)({
  gap: '12px',
});

const Name = styled(Box)({
  fontFamily: partyFonts.gothic,
  color: partyColors.yellow,
  fontSize: '1.4rem',
  lineHeight: 1.1,
});

const ErrorText = styled(Box)({
  fontFamily: partyFonts.body,
  color: partyColors.debuff,
  fontSize: '0.86rem',
  marginTop: '10px',
});

const Bar = styled(Skeleton)({
  backgroundColor: partyColors.grey,
});

// Each card owns its own detail fetch, so the takeover fills in member-by-member.
// The fallback name (from the list) keeps a dead/loading card identifiable.
export function WarbandCard({ id, name, active }: WarbandCardProps) {
  const { t } = useTranslation();
  const { member, isLoading, isError } = useWarbandMember(id, { enabled: active });

  if (member) {
    return <WarbandCardView member={member} />;
  }

  if (isError) {
    return (
      <Shell data-testid="warband-card-error">
        <Name>{name}</Name>
        <ErrorText>{t('party.cardError', "This scvm's sheet wouldn't load.")}</ErrorText>
      </Shell>
    );
  }

  return (
    <LoadingShell data-testid="warband-card-loading" aria-busy={isLoading}>
      <Name>{name}</Name>
      <Bar variant="rectangular" height={12} />
      <Bar variant="rectangular" height={64} />
      <Bar variant="rectangular" height={48} />
      <Bar variant="rectangular" height={80} />
    </LoadingShell>
  );
}
