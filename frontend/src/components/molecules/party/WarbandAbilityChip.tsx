import { WarbandTooltip } from '@/components/atoms/party/WarbandTooltip';
import { partyColors, partyFonts } from '@/theme/partyTokens';
import { Box, styled } from '@mui/material';

type AbilityTone = 'pink' | 'white' | 'yellow' | 'dark';

type WarbandAbilityChipProps = {
  abbr: string;
  value: string;
  name: string;
  description: string;
  tone: AbilityTone;
};

const surface = (tone: AbilityTone) => {
  switch (tone) {
    case 'pink':
      return { bg: partyColors.pink, fg: partyColors.black, border: partyColors.black };
    case 'white':
      return { bg: partyColors.white, fg: partyColors.black, border: partyColors.black };
    case 'yellow':
      return { bg: partyColors.yellow, fg: partyColors.black, border: partyColors.black };
    case 'dark':
    default:
      return { bg: partyColors.black, fg: partyColors.yellow, border: partyColors.yellow };
  }
};

const TipTitle = styled(Box)({
  fontFamily: partyFonts.label,
  fontSize: '0.56rem',
  letterSpacing: '0.14em',
});

const TipBody = styled(Box)({
  fontFamily: partyFonts.body,
  fontSize: '0.82rem',
  lineHeight: 1.35,
  marginTop: '3px',
});

const Chip = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'bg' && prop !== 'fg' && prop !== 'borderColor',
})<{ bg: string; fg: string; borderColor: string }>(({ bg, fg, borderColor }) => ({
  background: bg,
  color: fg,
  border: `2px solid ${borderColor}`,
  padding: '9px 3px',
  textAlign: 'center',
  cursor: 'pointer',
  outlineOffset: 2,
}));

const Abbr = styled(Box)({
  fontFamily: partyFonts.label,
  fontSize: '0.5rem',
  letterSpacing: '0.06em',
  opacity: 0.72,
});

const Value = styled(Box)({
  fontFamily: partyFonts.headline,
  fontSize: '1.45rem',
  lineHeight: 1,
});

// One ability stat (AGI/PRE/STR/TOU) as a stamped chip; focus/tap reveals what the
// ability governs. The dark TOU chip uses the inverted (dark) tooltip per the design.
export function WarbandAbilityChip({
  abbr,
  value,
  name,
  description,
  tone,
}: WarbandAbilityChipProps) {
  const s = surface(tone);
  return (
    <WarbandTooltip
      tone={tone === 'dark' ? 'dark' : 'yellow'}
      width={186}
      title={
        <Box>
          <TipTitle>
            {name} · {value}
          </TipTitle>
          <TipBody>{description}</TipBody>
        </Box>
      }
    >
      <Chip tabIndex={0} bg={s.bg} fg={s.fg} borderColor={s.border}>
        <Abbr>{abbr}</Abbr>
        <Value>{value}</Value>
      </Chip>
    </WarbandTooltip>
  );
}
