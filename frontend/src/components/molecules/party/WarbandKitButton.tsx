import { WarbandTooltip } from '@/components/atoms/party/WarbandTooltip';
import { partyColors, partyFonts } from '@/theme/partyTokens';
import type { WarbandEquipView } from '@/components/organisms/party/warbandMember';
import { Box, styled } from '@mui/material';
import { useTranslation } from 'react-i18next';

type WarbandKitButtonProps = {
  equipment: WarbandEquipView[];
  equipCount: number;
};

const StampHeading = styled(Box)({
  fontFamily: partyFonts.headline,
  fontSize: '1rem',
  letterSpacing: '0.06em',
  color: partyColors.yellow,
  border: `2px solid ${partyColors.yellow}`,
  display: 'inline-block',
  padding: '1px 8px',
  marginBottom: '11px',
  textTransform: 'uppercase',
});

const EmptyNote = styled(Box)({
  fontFamily: partyFonts.body,
  fontStyle: 'italic',
  color: '#9a9a9a',
  fontSize: '0.82rem',
});

const EquipList = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '9px',
});

const EquipName = styled(Box)({
  fontFamily: partyFonts.label,
  fontSize: '0.72rem',
  letterSpacing: '0.06em',
  color: partyColors.white,
  textTransform: 'uppercase',
});

const EquipDesc = styled(Box)({
  fontFamily: partyFonts.body,
  fontStyle: 'italic',
  color: '#9a9a9a',
  fontSize: '0.82rem',
  lineHeight: 1.3,
  marginTop: '1px',
});

const Pill = styled(Box)({
  flex: 1,
  background: partyColors.yellow,
  color: partyColors.black,
  border: `2px solid ${partyColors.black}`,
  padding: '9px 6px',
  textAlign: 'center',
  fontFamily: partyFonts.label,
  fontSize: '0.6rem',
  letterSpacing: '0.14em',
  cursor: 'pointer',
  outlineOffset: 2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  textTransform: 'uppercase',
});

const Count = styled('span')({
  background: partyColors.black,
  color: partyColors.yellow,
  fontSize: '0.56rem',
  padding: '0 5px',
  lineHeight: 1.5,
});

// The "KIT" pill: the scvm's carried equipment, with a count badge, surfaced on
// focus/tap. Empty kits still read clearly rather than showing a blank box.
export function WarbandKitButton({ equipment, equipCount }: WarbandKitButtonProps) {
  const { t } = useTranslation();

  return (
    <WarbandTooltip
      tone="dark"
      width={268}
      placement="top-end"
      title={
        <Box>
          <StampHeading>{t('gm.equipment', 'Equipment')}</StampHeading>
          {equipment.length === 0 ? (
            <EmptyNote>{t('gm.noEquipment', 'Carrying nothing of note.')}</EmptyNote>
          ) : (
            <EquipList>
              {equipment.map((eq, i) => (
                <Box key={`${eq.name}-${i}`}>
                  <EquipName>{eq.name}</EquipName>
                  {eq.desc && <EquipDesc>{eq.desc}</EquipDesc>}
                </Box>
              ))}
            </EquipList>
          )}
        </Box>
      }
    >
      <Pill tabIndex={0}>
        {t('party.kit', 'Kit')}
        <Count>{equipCount}</Count>
      </Pill>
    </WarbandTooltip>
  );
}
