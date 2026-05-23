import { Box, ButtonBase, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { type CustomItemKind } from '@/inventory/customItems';
import { morkBorgColors } from '@/theme/morkBorgTheme';
import KindGlyph from './KindGlyph';

interface KindSelectorProps {
  value: CustomItemKind;
  onChange: (next: CustomItemKind) => void;
}

// Quieter, single-row grid: five equal tiles. Glyph above a small label.
// Brutalist enough to be on-brand (sharp corners, yellow-on-black selected
// state) without dominating the modal.
const KINDS: CustomItemKind[] = [
  'weapon',
  'armor',
  'ammo',
  'consumable',
  'misc',
];

const tileBase = {
  display: 'grid',
  gridTemplateRows: 'auto auto',
  alignItems: 'center',
  justifyItems: 'center',
  gap: 0.5,
  minHeight: 64,
  px: 0.75,
  py: 1,
  border: `1px solid ${morkBorgColors.darkGrey}`,
  color: morkBorgColors.white,
  bgcolor: 'transparent',
  textTransform: 'uppercase',
  fontFamily: "'Antonio', sans-serif",
  fontSize: '0.7rem',
  letterSpacing: '0.1em',
  cursor: 'pointer',
  transition: 'background-color 0.12s ease, color 0.12s ease',
  '&:hover': {
    backgroundColor: morkBorgColors.pink,
    color: morkBorgColors.black,
  },
  '&:focus-visible': {
    outline: `2px solid ${morkBorgColors.yellow}`,
    outlineOffset: '2px',
  },
} as const;

const tileSelected = {
  backgroundColor: morkBorgColors.yellow,
  color: morkBorgColors.black,
  borderColor: morkBorgColors.yellow,
  '&:hover': {
    backgroundColor: morkBorgColors.yellow,
    color: morkBorgColors.black,
  },
} as const;

export default function KindSelector({ value, onChange }: KindSelectorProps) {
  const { t } = useTranslation();

  return (
    <Box
      role="radiogroup"
      aria-label={t('equipment.customItem.kind', 'Item kind')}
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(3, minmax(0, 1fr))',
          sm: 'repeat(5, minmax(0, 1fr))',
        },
        gap: 0.75,
      }}
    >
      {KINDS.map((kind) => {
        const selected = value === kind;
        const label = t(
          `equipment.customItem.kinds.${kind}`,
          kind.charAt(0).toUpperCase() + kind.slice(1),
        );
        return (
          <ButtonBase
            key={kind}
            role="radio"
            aria-checked={selected}
            aria-label={label}
            onClick={() => onChange(kind)}
            sx={{
              ...tileBase,
              ...(selected && tileSelected),
            }}
          >
            <KindGlyph kind={kind} size={22} />
            <Typography
              component="span"
              sx={{
                fontFamily: 'inherit',
                fontSize: 'inherit',
                letterSpacing: 'inherit',
                lineHeight: 1,
              }}
            >
              {label}
            </Typography>
          </ButtonBase>
        );
      })}
    </Box>
  );
}
