import { openParty } from '@/components/organisms/party/partyStore';
import { partyColors, partyFonts } from '@/theme/partyTokens';
import { ButtonBase, styled } from '@mui/material';
import { useTranslation } from 'react-i18next';

type PartyPullTabProps = { count: number };

const Tab = styled(ButtonBase)(({ theme }) => ({
  position: 'fixed',
  top: '50%',
  right: 0,
  transform: 'translateY(-50%)',
  zIndex: theme.zIndex.appBar,
  background: partyColors.pink,
  color: partyColors.black,
  border: `2px solid ${partyColors.black}`,
  borderRight: 'none',
  boxShadow: '-3px 3px 0 rgba(10,10,10,0.4)',
  padding: '14px 7px',
  writingMode: 'vertical-rl',
  textOrientation: 'mixed',
  fontFamily: partyFonts.headline,
  letterSpacing: '0.12em',
  fontSize: '1rem',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  '&:hover': { background: partyColors.yellow },
  '@media (prefers-reduced-motion: no-preference)': {
    transition: 'background .12s ease-out',
  },
}));

const Count = styled('span')({
  background: partyColors.black,
  color: partyColors.yellow,
  fontSize: '0.8rem',
  padding: '0 3px',
  minWidth: 18,
  textAlign: 'center',
});

// Trigger 2: a pull-tab bookmark stuck to the right screen edge. Always present (on
// any viewport) while the rack has scvms and the takeover is closed, so the warband
// is one reach away from anywhere in the app.
export function PartyPullTab({ count }: PartyPullTabProps) {
  const { t } = useTranslation();
  if (count <= 0) return null;

  return (
    <Tab
      data-testid="party-pull-tab"
      className="print-hidden"
      onClick={() => openParty()}
      aria-label={t('party.open', 'Open party view')}
    >
      ♟ {t('party.pill', 'Party')}
      <Count>{count}</Count>
    </Tab>
  );
}
