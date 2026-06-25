import { partyColors, partyFonts } from '@/theme/partyTokens';
import { WarbandTarotDeck } from '@/components/organisms/party/WarbandTarotDeck';
import type { PartyMember } from '@/hooks/useParty';
import CloseIcon from '@mui/icons-material/Close';
import { Box, Drawer, styled, useMediaQuery, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';

type PartyViewProps = {
  open: boolean;
  onClose: () => void;
  members: PartyMember[];
};

const HeaderBar = styled(Box)({
  background: partyColors.black,
  borderBottom: `3px solid ${partyColors.pink}`,
  padding: '15px 20px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexShrink: 0,
  gap: '12px',
});

const TitleGroup = styled(Box)({
  display: 'flex',
  alignItems: 'baseline',
  gap: '14px',
  flexWrap: 'wrap',
});

const Title = styled(Box)({
  fontFamily: partyFonts.headline,
  fontSize: '1.9rem',
  color: partyColors.yellow,
  letterSpacing: '0.04em',
  lineHeight: 0.9,
});

const Subtitle = styled(Box)({
  fontFamily: partyFonts.label,
  fontSize: '0.58rem',
  letterSpacing: '0.16em',
  color: partyColors.pink,
  textTransform: 'uppercase',
});

const CloseButton = styled('button')({
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '9px',
  background: partyColors.pink,
  color: partyColors.black,
  border: `2px solid ${partyColors.black}`,
  boxShadow: `3px 3px 0 ${partyColors.yellow}`,
  padding: '6px 12px',
  fontFamily: partyFonts.label,
  fontSize: '0.6rem',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
});

const EmptyState = styled(Box)({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '30px 24px',
  textAlign: 'center',
});

const EmptyText = styled(Box)({
  fontFamily: partyFonts.body,
  fontSize: '1rem',
  color: partyColors.black,
  maxWidth: '40ch',
});

const StripWrap = styled(Box)({
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
  padding: '24px 16px',
});

// The party takeover: a roomy panel that rides on top of the sheet (sliding in from
// the right on desktop, up from the bottom on mobile) and dims it behind. Read-only —
// the whole warband as full Tarot cards in responsive columns. The GM gets a different
// view (the dense Vital Strip on PartyPage) — do not re-unify these.
export function PartyView({ open, onClose, members }: PartyViewProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Drawer
      anchor={isMobile ? 'bottom' : 'right'}
      open={open}
      onClose={onClose}
      data-testid="party-view"
      slotProps={{
        backdrop: { sx: { backgroundColor: 'rgba(10,10,10,0.62)' } },
        paper: {
          sx: {
            backgroundColor: partyColors.yellow,
            backgroundImage: 'none',
            borderRadius: 0,
            display: 'flex',
            flexDirection: 'column',
            ...(isMobile
              ? {
                  height: '90%',
                  borderTop: `3px solid ${partyColors.black}`,
                  boxShadow: '0 -12px 30px rgba(0,0,0,0.5)',
                }
              : {
                  width: '92%',
                  maxWidth: 1160,
                  borderLeft: `3px solid ${partyColors.black}`,
                  boxShadow: '-14px 0 36px rgba(0,0,0,0.55)',
                }),
          },
        },
      }}
    >
      <HeaderBar>
        <TitleGroup>
          <Title>{t('party.title', 'The Warband')}</Title>
          <Subtitle>
            {t('party.subtitleTap', '{{count}} scvms · read-only · tap ▸', {
              count: members.length,
            })}
          </Subtitle>
        </TitleGroup>
        <CloseButton
          type="button"
          onClick={onClose}
          aria-label={t('party.close', 'Close party view')}
          data-testid="party-close"
        >
          {t('party.closeAction', 'Close')}
          <CloseIcon sx={{ fontSize: 16 }} />
        </CloseButton>
      </HeaderBar>

      {members.length === 0 ? (
        <EmptyState data-testid="party-empty">
          <EmptyText>
            {t(
              'party.empty',
              'No scvms in the rack yet. Roll one up and it joins the warband.',
            )}
          </EmptyText>
        </EmptyState>
      ) : (
        <StripWrap>
          <WarbandTarotDeck members={members} active={open} />
        </StripWrap>
      )}
    </Drawer>
  );
}
