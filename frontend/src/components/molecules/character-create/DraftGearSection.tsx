import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { aggregateItems } from '@/utils/aggregateItems';
import type { EquipmentItem } from '@/hooks/models';
import { DraftSection, type SectionProps } from './DraftSection';
import { morkBorgColors } from '@/theme/morkBorgTheme';

type Named = { key?: string; name?: string | null; amount?: number };

function ItemLine({ item, quantity = 1 }: { item: Named; quantity?: number }) {
  return (
    <Typography
      component="li"
      sx={{
        color: morkBorgColors.black,
        fontFamily: '"Alegreya", Georgia, serif',
        fontSize: { xs: '1rem', sm: '1.05rem' },
        fontWeight: 700,
        lineHeight: 1.25,
        mb: 0.35,
      }}
    >
      {item.name ?? item.key}
      {typeof item.amount === 'number' && item.amount > 1
        ? ` x${item.amount}`
        : ''}
      {quantity > 1 ? ` x${quantity}` : ''}
    </Typography>
  );
}

const groupStyle = (
  accent: string,
  rotation: string,
  background = morkBorgColors.white,
) => ({
  bgcolor: background,
  color: morkBorgColors.black,
  border: `3px solid ${morkBorgColors.black}`,
  boxShadow: `4px 4px 0 ${accent}`,
  p: { xs: 1.15, sm: 1.35 },
  mb: 1.25,
  transform: rotation,
});

const labelStyle = {
  display: 'inline-block',
  bgcolor: morkBorgColors.black,
  color: morkBorgColors.yellow,
  border: `2px solid ${morkBorgColors.black}`,
  fontFamily: '"Antonio", sans-serif',
  fontSize: '0.7rem',
  letterSpacing: '0.12em',
  lineHeight: 1,
  textTransform: 'uppercase',
  px: 0.75,
  py: 0.55,
  mb: 0.85,
};

const armorTextStyle = {
  color: morkBorgColors.black,
  fontFamily: '"Alegreya", Georgia, serif',
  fontSize: { xs: '1rem', sm: '1.05rem' },
  fontWeight: 700,
  lineHeight: 1.25,
};

export function DraftGearSection({
  preview,
  rollingSection,
  busy,
  onReroll,
}: SectionProps) {
  const { t } = useTranslation();
  const weapons = (preview.equippedWeapons ?? []).filter(
    (weapon): weapon is EquipmentItem => weapon !== null,
  );
  const armor = preview.equippedArmor;
  const equipment = aggregateItems(
    (preview.equipment ?? []) as EquipmentItem[],
  );

  return (
    <DraftSection
      title={t('create.sections.gear', 'Gear')}
      rolling={rollingSection === 'gear'}
      disabled={busy}
      onReroll={() => onReroll('gear')}
      rerollLabel={t('create.rerollGear', 'Re-roll gear')}
      testId="draft-gear"
      die="d100"
    >
      {weapons.length > 0 && (
        <Box sx={groupStyle(morkBorgColors.yellow, 'rotate(-0.28deg)')}>
          <Typography component="span" sx={labelStyle}>
            {t('create.weapons', 'Weapons')}
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            {weapons.map((weapon, index) => (
              <ItemLine key={`${weapon.key}-${index}`} item={weapon} />
            ))}
          </Box>
        </Box>
      )}
      {armor?.key && (
        <Box
          sx={groupStyle(
            morkBorgColors.pink,
            'rotate(0.22deg)',
            morkBorgColors.yellow,
          )}
        >
          <Typography
            component="span"
            sx={{ ...labelStyle, color: morkBorgColors.pink }}
          >
            {t('create.armor', 'Armor')}
          </Typography>
          <Typography sx={armorTextStyle}>{armor.name ?? armor.key}</Typography>
        </Box>
      )}
      <Box
        sx={{
          ...groupStyle(morkBorgColors.yellow, 'rotate(0.18deg)'),
          mb: 0.5,
        }}
      >
        <Typography component="span" sx={labelStyle}>
          {t('create.inventory', 'Inventory')}
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2 }}>
          {equipment.map((entry) => (
            <ItemLine
              key={`${entry.item.key ?? entry.item.name}-${entry.indices[0]}`}
              item={entry.item}
              quantity={entry.quantity}
            />
          ))}
        </Box>
      </Box>
    </DraftSection>
  );
}
