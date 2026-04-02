import { Box, Divider, Typography } from '@mui/material';
import { type EquipmentItem } from '@/hooks/models';
import { morkBorgColors } from '@/theme/morkBorgTheme';
import SummaryListItemRow from './SummaryListItemRow';

interface SummaryEncumbranceBreakdownProps {
  title: string;
  encumbrance: number;
  maxEncumbrance: number;
  items: EquipmentItem[];
  emptyLabel: string;
  unknownItemLabel: string;
}

export default function SummaryEncumbranceBreakdown({
  title,
  encumbrance,
  maxEncumbrance,
  items,
  emptyLabel,
  unknownItemLabel,
}: SummaryEncumbranceBreakdownProps) {
  return (
    <Box>
      <Typography
        sx={{
          fontFamily: "'Antonio', sans-serif",
          letterSpacing: '0.11em',
          textTransform: 'uppercase',
          color: morkBorgColors.yellow,
          fontSize: '0.72rem',
          mb: 0.8,
        }}
      >
        {title}
      </Typography>

      <Typography sx={{ color: 'rgba(245,245,245,0.8)', fontSize: '0.78rem', mb: 0.95 }}>
        {encumbrance} / {maxEncumbrance}
      </Typography>

      <Divider sx={{ borderColor: 'rgba(255, 62, 181, 0.4)', mb: 0.95 }} />

      {items.length === 0 ? (
        <Typography
          sx={{
            color: 'rgba(245,245,245,0.66)',
            fontStyle: 'italic',
            fontSize: '0.78rem',
          }}
        >
          {emptyLabel}
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.45, maxHeight: 220, overflowY: 'auto', pr: 0.4 }}>
          {items.map((item, index) => (
            <SummaryListItemRow
              key={`${item.key ?? 'enc-item'}-${index}`}
              label={item.name?.trim() || item.key || unknownItemLabel}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
