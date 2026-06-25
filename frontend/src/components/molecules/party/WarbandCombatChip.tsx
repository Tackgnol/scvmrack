import { WarbandTooltip } from '@/components/atoms/party/WarbandTooltip';
import { partyColors, partyFonts } from '@/theme/partyTokens';
import type { WarbandContribRow } from '@/components/organisms/party/warbandMember';
import { Box, styled } from '@mui/material';
import { useTranslation } from 'react-i18next';

type WarbandCombatChipProps = {
  label: string;
  value: number;
  rows: WarbandContribRow[];
};

const TipTitle = styled(Box)({
  fontFamily: partyFonts.label,
  fontSize: '0.56rem',
  letterSpacing: '0.14em',
  marginBottom: '6px',
});

const TipRow = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  gap: '10px',
  lineHeight: 1.5,
});

const TipRowLabel = styled('span')({
  fontFamily: partyFonts.body,
  fontSize: '0.82rem',
});

const TipRowValue = styled('span')({
  fontFamily: partyFonts.label,
  fontSize: '0.66rem',
  letterSpacing: '0.04em',
  alignSelf: 'center',
  color: partyColors.yellow,
});

const Chip = styled(Box)({
  background: partyColors.yellow,
  color: partyColors.black,
  border: `2px solid ${partyColors.black}`,
  padding: '9px 3px',
  textAlign: 'center',
  cursor: 'pointer',
  outlineOffset: 2,
});

const ChipLabel = styled(Box)({
  fontFamily: partyFonts.label,
  fontSize: '0.5rem',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
});

const ChipValue = styled(Box)({
  fontFamily: partyFonts.headline,
  fontSize: '1.35rem',
  lineHeight: 1,
});

// A combat DR (DODGE/MELEE/RANGED). Focus/tap shows what contributes to the target
// number — base test, governing ability, and any modifiers that move it.
export function WarbandCombatChip({ label, value, rows }: WarbandCombatChipProps) {
  const { t } = useTranslation();

  return (
    <WarbandTooltip
      tone="dark"
      width={206}
      title={
        <Box>
          <TipTitle sx={{ textTransform: 'uppercase' }}>{label}</TipTitle>
          {rows.map((row, i) => (
            <TipRow key={`${row.label}-${i}`}>
              <TipRowLabel>{row.labelKey ? t(row.labelKey, row.label) : row.label}</TipRowLabel>
              <TipRowValue>{row.val}</TipRowValue>
            </TipRow>
          ))}
        </Box>
      }
    >
      <Chip tabIndex={0}>
        <ChipLabel>{label}</ChipLabel>
        <ChipValue>{value}</ChipValue>
      </Chip>
    </WarbandTooltip>
  );
}
