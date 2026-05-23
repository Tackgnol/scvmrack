import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { type EquipmentItem } from '@/hooks/models';
import { morkBorgColors } from '@/theme/morkBorgTheme';

interface ItemStatChipsProps {
  item: EquipmentItem;
}

const chipStyle = {
  px: 0.75,
  py: 0.25,
  border: `1px solid ${morkBorgColors.yellow}`,
  color: morkBorgColors.yellow,
  fontFamily: "'Antonio', sans-serif",
  fontSize: '0.7rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  lineHeight: 1.3,
  whiteSpace: 'nowrap',
} as const;

const dimChipStyle = {
  ...chipStyle,
  borderColor: morkBorgColors.darkGrey,
  color: '#8a8a8a',
} as const;

const rowStyle = {
  display: 'flex',
  gap: 0.75,
  flexWrap: 'wrap',
  mt: 0.5,
} as const;

// Kind-aware "stat strip" under the item title. Each kind shows only the chips
// that are actually meaningful for it — empty space beats filler. Returns null
// if the item has nothing worth chipping.
export default function ItemStatChips({ item }: ItemStatChipsProps) {
  const { t } = useTranslation();
  const tags = item.tags ?? [];
  const chips: Array<{ key: string; label: string; dim?: boolean }> = [];

  const isWeapon = tags.includes('weapon') || tags.includes('shield');
  const isArmor = tags.includes('armor');
  const isAmmo = tags.includes('ammo');
  const isConsumable =
    tags.includes('consumable') ||
    (Array.isArray(item.uses) && item.uses.length > 0);

  if (isWeapon && item.dice && item.dice.length > 0) {
    chips.push({
      key: 'dice',
      label: item.dice.map((d) => `d${d}`).join(' / '),
    });
    if (item.ammoType) {
      chips.push({ key: 'ammoType', label: item.ammoType });
    }
  } else if (isArmor && item.dice && item.dice.length > 0) {
    chips.push({
      key: 'dice',
      label: `−${item.dice.map((d) => `d${d}`).join(' / ')}`,
    });
    if (item.maxTier != null) {
      const current = item.currentTier ?? item.maxTier;
      chips.push({
        key: 'tier',
        label: `${t('equipment.tier', 'tier')} ${current}/${item.maxTier}`,
        dim: current === 0,
      });
    }
  } else if (isAmmo) {
    if (item.ammoType) {
      chips.push({ key: 'ammoType', label: item.ammoType });
    }
    if (item.amount && item.amount > 0) {
      chips.push({ key: 'amount', label: `×${item.amount}` });
    }
  } else if (isConsumable && Array.isArray(item.uses)) {
    const total = item.uses.length;
    const remaining = item.uses.filter((u) => !u).length;
    chips.push({
      key: 'uses',
      label: `${remaining} / ${total} ${t('equipment.uses', 'uses')}`,
      dim: remaining === 0,
    });
  }

  if (item.value && item.value > 0) {
    chips.push({
      key: 'value',
      label: `${item.value}${t('equipment.silverShort', 's')}`,
      dim: true,
    });
  }

  if (chips.length === 0) return null;

  return (
    <Box sx={rowStyle}>
      {chips.map((chip) => (
        <Box
          key={chip.key}
          component="span"
          sx={chip.dim ? dimChipStyle : chipStyle}
        >
          {chip.label}
        </Box>
      ))}
    </Box>
  );
}
