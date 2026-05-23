import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { type EquipmentItem } from '@/hooks/models';
import { customStyles, morkBorgColors } from '@/theme/morkBorgTheme';
import KindGlyph from './KindGlyph';
import { type CustomItemKind } from '@/inventory/customItems';

interface CustomItemPreviewProps {
  items: EquipmentItem[];
  kind: CustomItemKind;
}

const headingRuleStyle = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  alignItems: 'center',
  gap: 1,
  mb: 0.75,
} as const;

const headingLabelStyle = {
  color: morkBorgColors.yellow,
  fontFamily: "'Antonio', sans-serif",
  fontSize: '0.7rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
} as const;

const headingRuleLineStyle = {
  height: '1px',
  backgroundColor: morkBorgColors.darkGrey,
} as const;

const emptyStateStyle = {
  border: `1px dashed ${morkBorgColors.darkGrey}`,
  p: 2,
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  alignItems: 'center',
  gap: 2,
  color: '#6b6b6b',
} as const;

const slotStyle = {
  ...customStyles.inventorySection.openItemSlot,
  cursor: 'default',
  '&:hover': {
    bgcolor: 'transparent',
    transform: 'none',
    borderLeftColor: morkBorgColors.pink,
  },
} as const;

const statRowStyle = {
  display: 'flex',
  gap: 1,
  flexWrap: 'wrap',
  mt: 0.5,
  color: morkBorgColors.yellow,
  fontFamily: "'Antonio', sans-serif",
  fontSize: '0.7rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
} as const;

const chip = (text: string) => (
  <Box
    key={text}
    component="span"
    sx={{
      px: 0.75,
      py: 0.25,
      border: `1px solid ${morkBorgColors.yellow}`,
    }}
  >
    {text}
  </Box>
);

function describeItem(
  item: EquipmentItem,
  kind: CustomItemKind,
  t: (key: string, fallback: string) => string,
): string[] {
  const chips: string[] = [];

  if (item.amount && item.amount > 1) chips.push(`×${item.amount}`);
  if (item.ammoType) chips.push(item.ammoType);
  if (item.dice && item.dice.length > 0) {
    chips.push(item.dice.map((d) => `d${d}`).join(' / '));
  }
  if (item.maxTier != null) chips.push(`tier ${item.maxTier}`);
  if (item.value && item.value > 0) {
    chips.push(`${item.value}${t('equipment.customItem.silverShort', 's')}`);
  }
  if (item.useCountRule?.base != null) {
    const mode = item.useCountRule.mode === 'fixedPlusModifier' ? '+stat' : '';
    chips.push(`${item.useCountRule.base}${mode} uses`);
  }
  if (item.modifiers && item.modifiers.length > 0) {
    const mod = item.modifiers[0];
    if (mod.value != null && mod.statistic) {
      const sign = mod.value >= 0 ? '+' : '';
      chips.push(`${sign}${mod.value} ${mod.statistic}`);
    }
  }
  if (chips.length === 0) chips.push(kind);
  return chips;
}

export default function CustomItemPreview({
  items,
  kind,
}: CustomItemPreviewProps) {
  const { t } = useTranslation();
  const primary = items[0];
  const bundled = items.slice(1);

  return (
    <Box>
      <Box sx={headingRuleStyle}>
        <Typography sx={headingLabelStyle}>
          {t('equipment.customItem.previewHeading', 'Preview')}
        </Typography>
        <Box sx={headingRuleLineStyle} aria-hidden />
      </Box>

      {!primary ? (
        <Box sx={emptyStateStyle}>
          <KindGlyph kind={kind} size={28} />
          <Typography
            variant="body2"
            sx={{
              fontFamily: "'Antonio', sans-serif",
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontSize: '0.72rem',
            }}
          >
            {t(
              'equipment.customItem.previewEmpty',
              'Name the item to see how it will sit in inventory.',
            )}
          </Typography>
        </Box>
      ) : (
        <Box sx={slotStyle}>
          <Box
            sx={{
              color: morkBorgColors.yellow,
              display: 'flex',
              alignItems: 'flex-start',
              pt: 0.25,
            }}
          >
            <KindGlyph kind={kind} size={24} />
          </Box>
          <Box sx={customStyles.inventorySection.itemContent}>
            <Typography
              variant="h6"
              sx={customStyles.inventorySection.openItemName}
            >
              {primary.name}
            </Typography>
            {primary.description && (
              <Typography
                variant="body2"
                sx={customStyles.inventorySection.openItemDescription}
              >
                {primary.description}
              </Typography>
            )}
            <Box sx={statRowStyle}>
              {describeItem(primary, kind, t).map(chip)}
            </Box>
            {bundled.length > 0 && (
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mt: 0.75,
                  color: morkBorgColors.pink,
                  fontFamily: "'Antonio', sans-serif",
                  fontSize: '0.68rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
              >
                +{' '}
                {bundled
                  .map(
                    (extra) =>
                      `${extra.amount ?? 1}× ${extra.name ?? extra.ammoType ?? 'ammo'}`,
                  )
                  .join(', ')}
              </Typography>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}
