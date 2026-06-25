import { openParty } from '@/components/organisms/party/partyStore';
import { partyColors, partyFonts } from '@/theme/partyTokens';
import { useParty } from '@/hooks/useParty';
import { ButtonBase, styled } from '@mui/material';
import { useTranslation } from 'react-i18next';

const Pill = styled(ButtonBase)({
  background: partyColors.pink,
  color: partyColors.black,
  border: `2px solid ${partyColors.black}`,
  boxShadow: `3px 3px 0 ${partyColors.black}`,
  fontFamily: partyFonts.label,
  fontWeight: 700,
  fontSize: '0.56rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  padding: '4px 10px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  transition: 'transform .08s ease-out, box-shadow .08s ease-out',
  '&:hover': { background: partyColors.yellow },
  '&:active': { transform: 'translate(2px, 2px)', boxShadow: 'none' },
});

const Count = styled('span')({
  background: partyColors.black,
  color: partyColors.yellow,
  fontFamily: partyFonts.headline,
  fontSize: '0.74rem',
  padding: '0 5px',
  lineHeight: 1.4,
});

// Trigger 1: the always-reachable PARTY pill in the toolbar. Opens the takeover in
// place — it never navigates away from the sheet. Count comes from the same warband
// query the drawer uses, so the pill, the pull-tab, and the panel never disagree;
// hidden when the rack is empty.
export function PartyTriggerPill() {
  const { t } = useTranslation();
  const { count } = useParty();
  if (count <= 0) return null;

  return (
    <Pill
      data-testid="party-pill"
      onClick={() => openParty()}
      aria-label={t('party.open', 'Open party view')}
    >
      ♟ {t('party.pill', 'Party')}
      <Count>{count}</Count>
    </Pill>
  );
}
