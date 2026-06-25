import { usePartyDetail } from '@/hooks/usePartyRepository';
import { usePartyStream } from '@/hooks/usePartyStream';
import { WarbandTarotDeck } from '@/components/organisms/party/WarbandTarotDeck';
import { partyColors, partyFonts } from '@/theme/partyTokens';
import {
  Box,
  Button,
  Drawer,
  styled,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { keyframes } from '@mui/system';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

type PartySheetPillProps = {
  partyId: string;
  characterId: string;
};

const pulse = keyframes`
  0% { box-shadow: -3px 3px 0 ${partyColors.black}; }
  45% { box-shadow: -7px 7px 0 ${partyColors.pink}; }
  100% { box-shadow: -3px 3px 0 ${partyColors.black}; }
`;

const SideTab = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'pulsing',
})<{ pulsing: boolean }>(({ theme, pulsing }) => ({
  position: 'fixed',
  top: '50%',
  right: 0,
  transform: 'translateY(-50%)',
  zIndex: theme.zIndex.appBar,
  minWidth: 0,
  background: partyColors.pink,
  color: partyColors.black,
  border: `2px solid ${partyColors.black}`,
  borderRight: 'none',
  borderRadius: 0,
  boxShadow: `-3px 3px 0 ${partyColors.black}`,
  padding: '13px 7px',
  writingMode: 'vertical-rl',
  textOrientation: 'mixed',
  fontFamily: partyFonts.headline,
  fontSize: '1rem',
  letterSpacing: '0.12em',
  lineHeight: 1,
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  animation: pulsing ? `${pulse} 520ms cubic-bezier(0.16, 1, 0.3, 1)` : 'none',
  '&:hover': { background: partyColors.yellow },
  '&:active': {
    transform: 'translateY(-50%) translate(2px, 2px)',
    boxShadow: 'none',
  },
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
  },
}));

const Count = styled('span')({
  background: partyColors.black,
  color: partyColors.yellow,
  fontSize: '0.82rem',
  padding: '0 4px',
  minWidth: 18,
  textAlign: 'center',
  lineHeight: 1.25,
});

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
  minWidth: 0,
  display: 'grid',
  gap: '5px',
});

const Title = styled(Box)({
  fontFamily: partyFonts.headline,
  fontSize: '1.9rem',
  color: partyColors.yellow,
  letterSpacing: '0.04em',
  lineHeight: 0.9,
  overflowWrap: 'anywhere',
});

const Subtitle = styled(Box)({
  fontFamily: partyFonts.label,
  fontSize: '0.58rem',
  letterSpacing: '0.16em',
  color: partyColors.pink,
  textTransform: 'uppercase',
});

const CloseButton = styled(Button)({
  cursor: 'pointer',
  background: partyColors.pink,
  color: partyColors.black,
  border: `2px solid ${partyColors.black}`,
  borderRadius: 0,
  boxShadow: `3px 3px 0 ${partyColors.yellow}`,
  padding: '6px 12px',
  fontFamily: partyFonts.label,
  fontSize: '0.6rem',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  '&:hover': { background: partyColors.yellow },
});

const Body = styled(Box)({
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
  padding: '18px 16px 24px',
  display: 'grid',
  alignContent: 'start',
  gap: '14px',
});

const ChangedFields = styled(Box)({
  fontFamily: partyFonts.body,
  color: partyColors.black,
  fontSize: '0.86rem',
  lineHeight: 1.2,
});

export function PartySheetPill({ partyId, characterId }: PartySheetPillProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const prefersReducedMotion = useMediaQuery(
    '(prefers-reduced-motion: reduce)',
  );
  const [open, setOpen] = useState(false);
  const partyQuery = usePartyDetail(partyId);
  const stream = usePartyStream(partyId, {
    enabled: Boolean(partyId),
    onClosed: () => setOpen(false),
  });
  const { clearChangedFields } = stream;
  const changedFields = stream.changedFieldsByCharacter[characterId] ?? [];
  const shouldPulse = changedFields.length > 0 && !prefersReducedMotion;
  const party = partyQuery.data;
  const members = (party?.members ?? []).map((member) => ({
    id: member.characterId,
    name: member.name,
  }));

  useEffect(() => {
    if (changedFields.length === 0) {
      return;
    }

    const timeout = window.setTimeout(() => {
      clearChangedFields(characterId);
    }, 1800);
    return () => window.clearTimeout(timeout);
  }, [changedFields.length, characterId, clearChangedFields]);

  if (!partyId) {
    return null;
  }

  return (
    <>
      {!open && (
        <SideTab
          type="button"
          className="print-hidden"
          pulsing={shouldPulse}
          data-testid="party-sheet-pill"
          onClick={() => setOpen(true)}
          aria-label={t('party.open', 'Open party view')}
        >
          {t('party.pill', 'Party')}
          <Count>{party?.memberCount ?? members.length}</Count>
        </SideTab>
      )}

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        data-testid="party-roster-drawer"
        slotProps={{
          backdrop: { sx: { backgroundColor: 'rgba(10,10,10,0.62)' } },
          paper: {
            sx: {
              bgcolor: partyColors.yellow,
              backgroundImage: 'none',
              borderRadius: 0,
              width: isMobile ? '94vw' : 'min(92vw, 1160px)',
              maxWidth: '100%',
              height: '100%',
              borderLeft: `3px solid ${partyColors.black}`,
              display: 'flex',
              flexDirection: 'column',
            },
          },
        }}
      >
        <HeaderBar>
          <TitleGroup>
            <Title>{party?.name ?? t('party.loadingName', 'Warband')}</Title>
            <Subtitle>
              {t('party.subtitleTap', '{{count}} scvms · read-only · tap ▸', {
                count: members.length,
              })}
            </Subtitle>
          </TitleGroup>
          <CloseButton type="button" onClick={() => setOpen(false)}>
            {t('party.closeAction', 'Close')}
          </CloseButton>
        </HeaderBar>

        <Body>
          {changedFields.length > 0 && (
            <ChangedFields>
              {t('party.changedFields', 'Updated: {{fields}}', {
                fields: changedFields.join(', '),
              })}
            </ChangedFields>
          )}

          {members.length > 0 && (
            <WarbandTarotDeck members={members} active={open} />
          )}
        </Body>
      </Drawer>
    </>
  );
}
