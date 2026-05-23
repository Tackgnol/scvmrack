import { Box, ButtonBase, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { type CustomItemKind } from '@/inventory/customItems';
import { morkBorgColors } from '@/theme/morkBorgTheme';
import KindGlyph from './KindGlyph';

interface KindSelectorProps {
  value: CustomItemKind;
  onChange: (next: CustomItemKind) => void;
}

// Asymmetric editorial-brutalist grid:
//   ┌──────────────┬──────┬──────┐
//   │   WEAPON     │ MISC │ ARMOR│
//   ├──────────────┴──┬───┴──────┤
//   │     AMMO        │ CONSUM.  │
//   └─────────────────┴──────────┘
// Weapon double-wide top-left (the most common path), ammo/consumable share
// the bottom row, misc and armor slot in next to weapon. Falls back to a
// single column on xs.
const GRID_AREAS_MD = `"weapon weapon misc armor" "ammo ammo consumable consumable"`;
const GRID_AREAS_XS = `"weapon weapon" "armor misc" "ammo consumable"`;

const tileBase = {
  display: 'grid',
  gridTemplateRows: 'auto 1fr',
  alignItems: 'center',
  justifyItems: 'center',
  gap: 0.75,
  minHeight: 96,
  px: 1,
  py: 1.5,
  border: `1px solid ${morkBorgColors.darkGrey}`,
  color: morkBorgColors.white,
  bgcolor: 'transparent',
  textTransform: 'uppercase',
  fontFamily: "'Bebas Neue', sans-serif",
  letterSpacing: '0.16em',
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

const KINDS: CustomItemKind[] = [
  'weapon',
  'misc',
  'armor',
  'ammo',
  'consumable',
];

export default function KindSelector({ value, onChange }: KindSelectorProps) {
  const { t } = useTranslation();

  return (
    <Box
      role="radiogroup"
      aria-label={t('equipment.customItem.kind', 'Item kind')}
      sx={{
        display: 'grid',
        gridTemplateAreas: { xs: GRID_AREAS_XS, sm: GRID_AREAS_MD },
        gridTemplateColumns: {
          xs: 'repeat(2, minmax(0, 1fr))',
          sm: 'repeat(4, minmax(0, 1fr))',
        },
        gap: 1,
      }}
    >
      {KINDS.map((kind) => {
        const selected = value === kind;
        const label = t(
          `equipment.customItem.kinds.${kind}`,
          kind === 'misc'
            ? 'Trinket'
            : kind === 'ammo'
              ? 'Ammo'
              : kind.charAt(0).toUpperCase() + kind.slice(1),
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
              gridArea: kind,
              ...(kind === 'weapon' && {
                fontSize: '1.05rem',
                minHeight: { xs: 112, sm: 132 },
              }),
              ...(selected && tileSelected),
            }}
          >
            <KindGlyph kind={kind} size={kind === 'weapon' ? 44 : 32} />
            <Typography
              component="span"
              sx={{
                fontFamily: 'inherit',
                fontSize: kind === 'weapon' ? '0.95rem' : '0.78rem',
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
