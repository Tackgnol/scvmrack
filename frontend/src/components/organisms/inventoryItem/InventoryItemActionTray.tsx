import { Box, Button, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { customStyles, morkBorgColors } from '@/theme/morkBorgTheme';
import { type SellPrice } from './resolveSellValue';

interface InventoryItemActionTrayProps {
  moveLabel: string;
  onMove: () => void;
  onSell: () => void;
  onDrop: () => void;
  /** Resolved sell price (per unit + provenance flag). */
  sellPrice: SellPrice;
  /** Total sell value at the current local quantity. */
  sellTotal: number;
  /** Current local quantity — drives whether the "(Ys × N)" annotation shows. */
  quantity: number;
}

const actionRow = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
  gap: 1,
  mt: 1,
} as const;

const dropRow = {
  mt: 1.5,
  display: 'grid',
  gap: 0.25,
} as const;

const dropButton = {
  border: `1px solid ${morkBorgColors.pink}`,
  color: morkBorgColors.pink,
  fontFamily: "'Bebas Neue', sans-serif",
  fontSize: '0.85rem',
  letterSpacing: '0.18em',
  borderRadius: 0,
  py: 0.5,
  '&:hover': {
    backgroundColor: morkBorgColors.pink,
    color: morkBorgColors.black,
  },
} as const;

const dropHint = {
  fontFamily: "'Antonio', sans-serif",
  fontSize: '0.65rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  color: morkBorgColors.pink,
  opacity: 0.7,
  textAlign: 'center' as const,
};

const annotationStyle = {
  ml: 0.75,
  fontSize: '0.65rem',
  letterSpacing: '0.1em',
  opacity: 0.7,
} as const;

const fallbackAnnotationStyle = {
  ml: 0.75,
  fontSize: '0.6rem',
  letterSpacing: '0.1em',
  opacity: 0.55,
} as const;

// Bottom tray: Move + Sell as a pair, Drop demoted to its own line. The
// visual demotion + "permanently destroys" helper replaces a confirmation
// modal — the friction comes from how Drop *looks*, not from a click count.
export default function InventoryItemActionTray({
  moveLabel,
  onMove,
  onSell,
  onDrop,
  sellPrice,
  sellTotal,
  quantity,
}: InventoryItemActionTrayProps) {
  const { t } = useTranslation();
  const silverShort = t('equipment.silverShort', 's');

  return (
    <Box>
      <Box sx={actionRow}>
        <Button onClick={onMove} sx={customStyles.buttons.action}>
          {moveLabel}
        </Button>
        <Button onClick={onSell} sx={customStyles.buttons.action}>
          {t('equipment.sell', { amount: sellTotal })}
          {quantity > 1 && (
            <Typography component="span" sx={annotationStyle}>
              ({sellPrice.perUnit}
              {silverShort} × {quantity})
            </Typography>
          )}
          {!sellPrice.fromCatalog && (
            <Typography
              component="span"
              sx={fallbackAnnotationStyle}
              title={t(
                'equipment.sellFallbackTooltip',
                'No value set on this item, using the default sell price.',
              )}
            >
              ({t('equipment.sellFallback', 'estimated')})
            </Typography>
          )}
        </Button>
      </Box>

      <Box sx={dropRow}>
        <Button onClick={onDrop} sx={dropButton} variant="outlined">
          {t('equipment.drop')}
        </Button>
        <Typography sx={dropHint}>
          {t('equipment.dropHint', 'Permanently destroys this item')}
        </Typography>
      </Box>
    </Box>
  );
}
