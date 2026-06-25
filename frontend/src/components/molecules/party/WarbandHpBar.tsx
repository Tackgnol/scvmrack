import { partyColors, partyFonts } from '@/theme/partyTokens';
import { Box, styled } from '@mui/material';
import { useTranslation } from 'react-i18next';

type WarbandHpBarProps = { hpText: string; hpPct: number };

const Root = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
});

const Header = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
});

const Label = styled('span')({
  fontFamily: partyFonts.label,
  fontSize: '0.58rem',
  letterSpacing: '0.2em',
  color: partyColors.mutedText,
  textTransform: 'uppercase',
});

const Value = styled('span')({
  fontFamily: partyFonts.headline,
  fontSize: '1.4rem',
  color: partyColors.white,
  letterSpacing: '0.04em',
  lineHeight: 1,
});

const Track = styled(Box)({
  height: 12,
  background: partyColors.grey,
  border: `1px solid ${partyColors.darkGrey}`,
});

const Fill = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'pct',
})<{ pct: number }>(({ pct }) => ({
  height: '100%',
  background: partyColors.blood,
  width: `${pct}%`,
}));

export function WarbandHpBar({ hpText, hpPct }: WarbandHpBarProps) {
  const { t } = useTranslation();
  const label = t('gm.hitPoints', 'Hit points');

  return (
    <Root>
      <Header>
        <Label>{label}</Label>
        <Value>{hpText}</Value>
      </Header>
      <Track
        role="progressbar"
        aria-valuenow={hpPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <Fill pct={hpPct} />
      </Track>
    </Root>
  );
}
