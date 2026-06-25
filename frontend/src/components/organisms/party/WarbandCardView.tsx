import { WarbandAbilityChip } from '@/components/molecules/party/WarbandAbilityChip';
import { WarbandCombatChip } from '@/components/molecules/party/WarbandCombatChip';
import { WarbandHpBar } from '@/components/molecules/party/WarbandHpBar';
import { WarbandKitButton } from '@/components/molecules/party/WarbandKitButton';
import { WarbandLooksButton } from '@/components/molecules/party/WarbandLooksButton';
import { WarbandModifierList } from '@/components/molecules/party/WarbandModifierList';
import { partyColors, partyFonts } from '@/theme/partyTokens';
import type { WarbandMember } from '@/components/organisms/party/warbandMember';
import { Box, styled } from '@mui/material';
import { useTranslation } from 'react-i18next';

type WarbandCardViewProps = { member: WarbandMember };

const Root = styled(Box)({
  width: '100%',
  height: '100%',
  background: partyColors.black,
  border: `1px solid ${partyColors.grey}`,
  boxShadow: '6px 6px 0 rgba(10,10,10,0.28)',
  display: 'flex',
  flexDirection: 'column',
});

const Head = styled(Box)({
  background: '#111111',
  padding: '16px 16px 14px',
  borderBottom: `2px solid ${partyColors.grey}`,
});

const NameRow = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '8px',
});

const Name = styled(Box)({
  fontFamily: partyFonts.gothic,
  color: partyColors.yellow,
  fontSize: '1.6rem',
  lineHeight: 1,
});

const DeadTag = styled('span')({
  background: partyColors.blood,
  color: partyColors.yellow,
  fontFamily: partyFonts.label,
  fontSize: '0.56rem',
  letterSpacing: '0.14em',
  padding: '3px 6px',
  whiteSpace: 'nowrap',
  alignSelf: 'center',
});

const ClassLine = styled(Box)({
  fontFamily: partyFonts.label,
  fontSize: '0.64rem',
  letterSpacing: '0.2em',
  color: partyColors.mutedText,
  textTransform: 'uppercase',
  marginTop: '7px',
});

const Body = styled(Box)({
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '15px',
  flex: 1,
});

const SectionLabel = styled(Box)({
  fontFamily: partyFonts.label,
  fontSize: '0.55rem',
  letterSpacing: '0.2em',
  color: partyColors.mutedText,
  marginBottom: '6px',
  textTransform: 'uppercase',
});

const AbilityGrid = styled(Box)({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '5px',
});

const CombatGrid = styled(Box)({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '5px',
});

const KeyStatGrid = styled(Box)({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '10px 12px',
  background: '#111111',
  padding: '13px 14px',
  border: `1px solid ${partyColors.grey}`,
});

const KeyStatLabel = styled(Box)({
  fontFamily: partyFonts.label,
  fontSize: '0.5rem',
  letterSpacing: '0.18em',
  color: partyColors.mutedText,
  textTransform: 'uppercase',
});

const KeyStatText = styled(Box)({
  fontFamily: partyFonts.body,
  fontSize: '0.88rem',
  color: partyColors.white,
  lineHeight: 1.25,
});

const KeyStatNumeral = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'tone',
})<{ tone: string }>(({ tone }) => ({
  fontFamily: partyFonts.headline,
  fontSize: '1.2rem',
  color: tone,
  lineHeight: 1,
}));

const Footer = styled(Box)({
  display: 'flex',
  gap: '8px',
  borderTop: `1px solid ${partyColors.grey}`,
  paddingTop: '13px',
  marginTop: 'auto',
});

// The read-only warband card — a whole scvm at a glance: identity, HP, abilities,
// combat DRs, kit summary, and modifiers. Presentational only; data arrives already
// projected so this renders identically in tests with a stub member.
export function WarbandCardView({ member }: WarbandCardViewProps) {
  const { t } = useTranslation();

  return (
    <Root data-testid="warband-card">
      <Head>
        <NameRow>
          <Name>{member.name}</Name>
          {member.dead && <DeadTag>† DEAD</DeadTag>}
        </NameRow>
        <ClassLine>{member.cls}</ClassLine>
      </Head>

      <Body>
        <WarbandHpBar hpText={member.hpText} hpPct={member.hpPct} />

        <Box>
          <SectionLabel>{t('gm.abilities', 'Abilities')}</SectionLabel>
          <AbilityGrid>
            <WarbandAbilityChip abbr="AGI" value={member.agi} name={t('gm.agility', 'Agility')} tone="pink" description={t('gm.agilityTip', 'Dodging, fleeing, initiative, and ranged aim.')} />
            <WarbandAbilityChip abbr="PRE" value={member.pre} name={t('gm.presence', 'Presence')} tone="white" description={t('gm.presenceTip', 'Perception, powers, and ranged attacks.')} />
            <WarbandAbilityChip abbr="STR" value={member.str} name={t('gm.strength', 'Strength')} tone="yellow" description={t('gm.strengthTip', 'Melee attacks, carrying, and breaking things.')} />
            <WarbandAbilityChip abbr="TOU" value={member.tou} name={t('gm.toughness', 'Toughness')} tone="dark" description={t('gm.toughnessTip', 'HP, poison, infection, and endurance.')} />
          </AbilityGrid>
        </Box>

        <Box>
          <SectionLabel>{t('gm.combat', 'Combat')}</SectionLabel>
          <CombatGrid>
            <WarbandCombatChip label={t('gm.dodge', 'Dodge')} value={member.dodge} rows={member.dodgeC} />
            <WarbandCombatChip label={t('gm.melee', 'Melee')} value={member.melee} rows={member.meleeC} />
            <WarbandCombatChip label={t('gm.ranged', 'Ranged')} value={member.ranged} rows={member.rangedC} />
            <WarbandCombatChip
              label="DR"
              value={member.dr}
              rows={[{ label: t('gm.armor', 'Armor'), val: member.armor }]}
            />
          </CombatGrid>
        </Box>

        <KeyStatGrid>
          <Box>
            <KeyStatLabel>{t('gm.weapon', 'Weapon')}</KeyStatLabel>
            <KeyStatText>{member.weapon}</KeyStatText>
          </Box>
          <Box>
            <KeyStatLabel>{t('gm.armor', 'Armor')}</KeyStatLabel>
            <KeyStatText>{member.armor}</KeyStatText>
          </Box>
          <Box>
            <KeyStatLabel>{t('gm.omens', 'Omens')}</KeyStatLabel>
            <KeyStatNumeral tone={partyColors.yellow}>{member.omenText}</KeyStatNumeral>
          </Box>
          <Box>
            <KeyStatLabel>{t('gm.silver', 'Silver')}</KeyStatLabel>
            <KeyStatNumeral tone={partyColors.white}>{member.silver}s</KeyStatNumeral>
          </Box>
        </KeyStatGrid>

        <Box>
          <SectionLabel>{t('gm.modifiers', 'Modifiers')}</SectionLabel>
          <WarbandModifierList modifiers={member.modifiers} />
        </Box>

        <Footer>
          <WarbandLooksButton
            trait1={member.trait1}
            trait2={member.trait2}
            habit={member.habit}
            bodyDesc={member.bodyDesc}
            origin={member.origin}
          />
          <WarbandKitButton equipment={member.equipment} equipCount={member.equipCount} />
        </Footer>
      </Body>
    </Root>
  );
}
