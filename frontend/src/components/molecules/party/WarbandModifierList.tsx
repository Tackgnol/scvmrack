import { WarbandTooltip } from '@/components/atoms/party/WarbandTooltip';
import { partyColors, partyFonts } from '@/theme/partyTokens';
import type { WarbandModifierView } from '@/components/organisms/party/warbandMember';
import { Box, styled } from '@mui/material';
import { useTranslation } from 'react-i18next';

type WarbandModifierListProps = { modifiers: WarbandModifierView[] };

const Empty = styled(Box)({
  fontFamily: partyFonts.body,
  fontStyle: 'italic',
  color: '#555',
  fontSize: '0.86rem',
});

const List = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
});

const TipHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  gap: '8px',
  alignItems: 'center',
  marginBottom: '4px',
});

const TipLabel = styled('span')({
  fontFamily: partyFonts.label,
  fontSize: '0.58rem',
  letterSpacing: '0.12em',
});

const TipEffect = styled('span', {
  shouldForwardProp: (prop) => prop !== 'edge',
})<{ edge: string }>(({ edge }) => ({
  fontFamily: partyFonts.label,
  fontSize: '0.58rem',
  letterSpacing: '0.05em',
  background: partyColors.black,
  color: edge,
  padding: '0 6px',
  whiteSpace: 'nowrap',
}));

const TipDesc = styled(Box)({
  fontFamily: partyFonts.body,
  fontSize: '0.84rem',
  lineHeight: 1.4,
});

const Strip = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'edge',
})<{ edge: string }>(({ edge }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  gap: '8px',
  alignItems: 'center',
  background: '#111111',
  padding: '7px 10px',
  border: `1px solid ${edge}`,
  cursor: 'pointer',
  outlineOffset: 2,
}));

const StripLabel = styled('span')({
  fontFamily: partyFonts.body,
  fontSize: '0.9rem',
  color: partyColors.white,
});

const StripEffect = styled('span', {
  shouldForwardProp: (prop) => prop !== 'edge',
})<{ edge: string }>(({ edge }) => ({
  fontFamily: partyFonts.label,
  fontSize: '0.6rem',
  letterSpacing: '0.05em',
  whiteSpace: 'nowrap',
  color: edge,
}));

// Active modifiers as buff/debuff strips. Each strip's focus/tap tooltip carries
// its full flavour. Empty state stays terse.
export function WarbandModifierList({ modifiers }: WarbandModifierListProps) {
  const { t } = useTranslation();

  if (modifiers.length === 0) {
    return <Empty>{t('gm.noModifiers', 'None active.')}</Empty>;
  }

  return (
    <List>
      {modifiers.map((mod, i) => (
        <WarbandTooltip
          key={`${mod.label}-${i}`}
          tone="yellow"
          width={240}
          placement="top-start"
          title={
            <Box>
              <TipHeader>
                <TipLabel>{mod.label.toUpperCase()}</TipLabel>
                <TipEffect edge={mod.edge}>
                  {`${mod.value} ${t(mod.statKey, mod.statFallback).toUpperCase()}`}
                </TipEffect>
              </TipHeader>
              <TipDesc>
                {mod.descKey ? t(mod.descKey, mod.desc) : mod.desc || '—'}
              </TipDesc>
            </Box>
          }
        >
          <Strip tabIndex={0} edge={mod.edge}>
            <StripLabel>{mod.label}</StripLabel>
            <StripEffect edge={mod.edge}>
              {`${mod.value} ${t(mod.statKey, mod.statFallback).toUpperCase()}`}
            </StripEffect>
          </Strip>
        </WarbandTooltip>
      ))}
    </List>
  );
}
