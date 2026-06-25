import { WarbandTooltip } from '@/components/atoms/party/WarbandTooltip';
import { partyColors, partyFonts } from '@/theme/partyTokens';
import { Box, styled } from '@mui/material';
import { useTranslation } from 'react-i18next';

type WarbandLooksButtonProps = {
  trait1: string;
  trait2: string;
  habit: string;
  bodyDesc: string;
  origin: string;
};

const StampHeading = styled(Box)({
  fontFamily: partyFonts.headline,
  fontSize: '1rem',
  letterSpacing: '0.06em',
  color: partyColors.yellow,
  border: `2px solid ${partyColors.yellow}`,
  display: 'inline-block',
  padding: '1px 8px',
  marginBottom: '12px',
  textTransform: 'uppercase',
});

const TraitGrid = styled(Box)({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '12px',
});

const FieldLabel = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'tone',
})<{ tone: string }>(({ tone }) => ({
  fontFamily: partyFonts.label,
  fontSize: '0.5rem',
  letterSpacing: '0.18em',
  color: tone,
  textTransform: 'uppercase',
}));

const TraitValue = styled(Box)({
  fontFamily: partyFonts.display,
  color: partyColors.white,
  fontSize: '1.3rem',
  lineHeight: 1.1,
  marginTop: '2px',
});

const FieldValue = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'tone',
})<{ tone: string }>(({ tone }) => ({
  fontFamily: partyFonts.body,
  fontStyle: 'italic',
  fontSize: '0.86rem',
  lineHeight: 1.35,
  marginTop: '2px',
  color: tone,
}));

const FieldGroup = styled(Box)({
  borderTop: `1px solid ${partyColors.darkGrey}`,
  marginTop: '9px',
  paddingTop: '9px',
});

const Pill = styled(Box)({
  flex: 1,
  background: partyColors.pink,
  color: partyColors.black,
  border: `2px solid ${partyColors.black}`,
  padding: '9px 6px',
  textAlign: 'center',
  fontFamily: partyFonts.label,
  fontSize: '0.6rem',
  letterSpacing: '0.14em',
  cursor: 'pointer',
  outlineOffset: 2,
  textTransform: 'uppercase',
});

// The "LOOKS" pill: the read-only flavour drawer for a scvm — traits, habit,
// body, and origin — surfaced on focus/tap.
export function WarbandLooksButton({
  trait1,
  trait2,
  habit,
  bodyDesc,
  origin,
}: WarbandLooksButtonProps) {
  const { t } = useTranslation();

  return (
    <WarbandTooltip
      tone="dark"
      width={300}
      placement="top-start"
      title={
        <Box>
          <StampHeading>{t('traits.title', 'Traits & Afflictions')}</StampHeading>
          <TraitGrid>
            <Box>
              <FieldLabel tone={partyColors.pink}>{t('traits.trait1', 'Trait 1')}</FieldLabel>
              <TraitValue>{trait1}</TraitValue>
            </Box>
            <Box>
              <FieldLabel tone={partyColors.pink}>{t('traits.trait2', 'Trait 2')}</FieldLabel>
              <TraitValue>{trait2}</TraitValue>
            </Box>
          </TraitGrid>
          <FieldGroup sx={{ mt: '11px' }}>
            <FieldLabel tone={partyColors.mutedText}>{t('traits.habit', 'Habit')}</FieldLabel>
            <FieldValue tone={partyColors.afflictionText}>{habit}</FieldValue>
          </FieldGroup>
          <FieldGroup>
            <FieldLabel tone={partyColors.mutedText}>{t('traits.bodyDescription', 'Body Description')}</FieldLabel>
            <FieldValue tone={partyColors.afflictionText}>{bodyDesc}</FieldValue>
          </FieldGroup>
          <FieldGroup>
            <FieldLabel tone={partyColors.pink}>{t('character.origin', 'Origin')}</FieldLabel>
            <FieldValue tone={partyColors.yellow}>{origin}</FieldValue>
          </FieldGroup>
        </Box>
      }
    >
      <Pill tabIndex={0}>{t('party.looks', 'Looks')}</Pill>
    </WarbandTooltip>
  );
}
