import { partyColors, partyFonts } from '@/theme/partyTokens';
import type { WarbandMember } from '@/components/organisms/party/warbandMember';
import { Box, styled } from '@mui/material';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type WarbandStripDetailsProps = {
  member: WarbandMember;
  actions?: ReactNode;
};

const Root = styled(Box)({
  background: partyColors.offBlack,
  borderTop: `1px solid ${partyColors.grey}`,
  padding: '16px 18px',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '18px',
});

const ColLabel = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'tone',
})<{ tone: string }>(({ tone }) => ({
  fontFamily: partyFonts.label,
  fontSize: '0.55rem',
  letterSpacing: '0.2em',
  color: tone,
  marginBottom: '6px',
}));

// mutedText clears AA (~5.4:1) on the off-black panel; #555 sat at ~2.5:1.
const Empty = styled(Box)({
  fontFamily: partyFonts.body,
  fontStyle: 'italic',
  color: partyColors.mutedText,
  fontSize: '0.84rem',
});

const ModList = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '3px',
});

const ModRow = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  gap: '8px',
  background: partyColors.black,
  padding: '5px 9px',
  alignItems: 'center',
});

const ModLabel = styled('span')({
  fontFamily: partyFonts.body,
  fontSize: '0.86rem',
  color: partyColors.white,
});

const ModEffect = styled('span', {
  shouldForwardProp: (prop) => prop !== 'edge',
})<{ edge: string }>(({ edge }) => ({
  fontFamily: partyFonts.label,
  fontSize: '0.58rem',
  letterSpacing: '0.06em',
  whiteSpace: 'nowrap',
  color: edge,
}));

const EquipmentList = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '7px',
});

const EquipmentName = styled(Box)({
  fontFamily: partyFonts.label,
  fontSize: '0.62rem',
  letterSpacing: '0.08em',
  color: partyColors.white,
  textTransform: 'uppercase',
});

const EquipmentDesc = styled(Box)({
  fontFamily: partyFonts.body,
  fontStyle: 'italic',
  color: partyColors.mutedText,
  fontSize: '0.82rem',
  lineHeight: 1.3,
  marginTop: '1px',
});

const GearList = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '5px',
});

const GearRow = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  gap: '10px',
});

const GearKey = styled('span')({
  fontFamily: partyFonts.label,
  fontSize: '0.56rem',
  letterSpacing: '0.12em',
  color: partyColors.mutedText,
});

const GearText = styled('span')({
  fontFamily: partyFonts.body,
  fontSize: '0.86rem',
  color: partyColors.white,
  textAlign: 'right',
});

const GearNumeral = styled('span', {
  shouldForwardProp: (prop) => prop !== 'tone',
})<{ tone: string }>(({ tone }) => ({
  fontFamily: partyFonts.headline,
  fontSize: '1rem',
  color: tone,
}));

const ActionWrap = styled(Box)({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
});

// The panel revealed when a Vital Strip row is tapped: modifiers, equipment, and a
// gear/resources column. The GM gets the full picture without leaving the roster.
export function WarbandStripDetails({
  member,
  actions,
}: WarbandStripDetailsProps) {
  const { t } = useTranslation();

  return (
    <Root data-testid="strip-details">
      <Box>
        <ColLabel tone={partyColors.mutedText}>
          {t('gm.modifiers', 'Modifiers')}
        </ColLabel>
        {member.hasMods ? (
          <ModList>
            {member.modifiers.map((mod, i) => (
              <ModRow key={`${mod.label}-${i}`}>
                <ModLabel>{mod.label}</ModLabel>
                <ModEffect edge={mod.edge}>
                  {`${mod.value} ${t(mod.statKey, mod.statFallback).toUpperCase()}`}
                </ModEffect>
              </ModRow>
            ))}
          </ModList>
        ) : (
          <Empty>{t('gm.noModifiers', 'None active.')}</Empty>
        )}
      </Box>

      <Box>
        <ColLabel tone={partyColors.pink}>
          {t('gm.equipment', 'Equipment')}
        </ColLabel>
        {member.equipment.length > 0 ? (
          <EquipmentList>
            {member.equipment.map((item, i) => (
              <Box key={`${item.name}-${i}`}>
                <EquipmentName>{item.name}</EquipmentName>
                {item.desc && <EquipmentDesc>{item.desc}</EquipmentDesc>}
              </Box>
            ))}
          </EquipmentList>
        ) : (
          <Empty>{t('gm.noEquipment', 'Carrying nothing of note.')}</Empty>
        )}
      </Box>

      <Box>
        <ColLabel tone={partyColors.mutedText}>
          {t('gm.gear', 'Gear & resources')}
        </ColLabel>
        <GearList>
          <GearRow>
            <GearKey>{t('gm.weapon', 'Weapon')}</GearKey>
            <GearText>{member.weapon}</GearText>
          </GearRow>
          <GearRow>
            <GearKey>{t('gm.armor', 'Armor')}</GearKey>
            <GearText>{member.armor}</GearText>
          </GearRow>
          <GearRow>
            <GearKey>{t('gm.omens', 'Omens')}</GearKey>
            <GearNumeral tone={partyColors.yellow}>
              {member.omenText}
            </GearNumeral>
          </GearRow>
          <GearRow>
            <GearKey>{t('gm.silver', 'Silver')}</GearKey>
            <GearNumeral tone={partyColors.white}>{member.silver}s</GearNumeral>
          </GearRow>
        </GearList>
      </Box>

      {actions && (
        <Box>
          <ColLabel tone={partyColors.pink}>
            {t('gm.management', 'Management')}
          </ColLabel>
          <ActionWrap>{actions}</ActionWrap>
        </Box>
      )}
    </Root>
  );
}
