import { ButtonBase, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { morkBorgColors } from '@/theme/morkBorgTheme';

interface EquipSlotButtonProps {
  slotLabel: string;
  currentItemName?: string;
  onClick: () => void;
  dataTestId?: string;
}

const wrap = {
  display: 'grid',
  gridTemplateRows: 'auto auto auto',
  alignItems: 'start',
  gap: 0.5,
  px: 1.25,
  py: 1,
  border: `1px solid ${morkBorgColors.darkGrey}`,
  textAlign: 'left',
  color: morkBorgColors.white,
  bgcolor: 'transparent',
  cursor: 'pointer',
  transition: 'background-color 0.12s ease, color 0.12s ease, border-color 0.12s ease',
  '&:hover': {
    backgroundColor: morkBorgColors.pink,
    color: morkBorgColors.black,
    borderColor: morkBorgColors.pink,
  },
  '&:focus-visible': {
    outline: `2px solid ${morkBorgColors.yellow}`,
    outlineOffset: '2px',
  },
} as const;

const slotLabelStyle = {
  color: morkBorgColors.yellow,
  fontFamily: "'Antonio', sans-serif",
  fontSize: '0.65rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  lineHeight: 1,
} as const;

const currentLineStyle = {
  fontFamily: "'Antonio', sans-serif",
  fontSize: '0.78rem',
  letterSpacing: '0.05em',
  lineHeight: 1.2,
  // currentColor so it flips on hover with the rest of the tile
} as const;

const actionStyle = {
  fontFamily: "'Bebas Neue', sans-serif",
  fontSize: '1rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  lineHeight: 1,
} as const;

const emptyStyle = {
  fontStyle: 'italic',
  color: 'inherit',
  opacity: 0.65,
} as const;

// One equip target. Shows what's currently in the slot so the user knows
// whether they're filling an empty hand or REPLACING a held weapon — the
// previous "EQUIP SLOT 1 / 2" buttons left the user guessing.
export default function EquipSlotButton({
  slotLabel,
  currentItemName,
  onClick,
  dataTestId,
}: EquipSlotButtonProps) {
  const { t } = useTranslation();
  const isOccupied = Boolean(currentItemName?.trim());

  return (
    <ButtonBase sx={wrap} onClick={onClick} data-testid={dataTestId}>
      <Typography sx={slotLabelStyle}>◢ {slotLabel}</Typography>
      <Typography
        sx={{
          ...currentLineStyle,
          ...(isOccupied ? {} : emptyStyle),
        }}
      >
        {isOccupied
          ? `${t('equipment.currentlyHolding', 'Currently')}: ${currentItemName}`
          : t('equipment.slotEmpty', 'Currently empty')}
      </Typography>
      <Typography sx={actionStyle}>
        {isOccupied
          ? t('equipment.replace', 'Replace')
          : t('equipment.equip', 'Equip')}
      </Typography>
    </ButtonBase>
  );
}
