import { Box, Divider, Typography } from '@mui/material';
import { type EquipmentItem } from '@/hooks/models';
import { type EncumbranceGroup } from '@/hooks/useSummaryMetrics';
import { morkBorgColors } from '@/theme/morkBorgTheme';
import SummaryListItemRow from './SummaryListItemRow';

interface SummaryEncumbranceBreakdownProps {
  title: string;
  encumbrance: number;
  maxEncumbrance: number;
  items: EquipmentItem[];
  groups?: EncumbranceGroup[];
  emptyLabel: string;
  unknownItemLabel: string;
  resolveGroupLabel?: (labelKey: string) => string;
}

const getItemLabel = (item: EquipmentItem, unknownItemLabel: string): string =>
  item.name?.trim() || item.key || unknownItemLabel;

export default function SummaryEncumbranceBreakdown({
  title,
  encumbrance,
  maxEncumbrance,
  items,
  groups,
  emptyLabel,
  unknownItemLabel,
  resolveGroupLabel,
}: SummaryEncumbranceBreakdownProps) {
  const visibleGroups =
    groups && groups.length > 0
      ? groups
      : [{ key: 'equipment' as const, label: '', items }];
  const hasVisibleItems = visibleGroups.some((group) => group.items.length > 0);

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

      <Typography
        sx={{ color: 'rgba(245,245,245,0.8)', fontSize: '0.78rem', mb: 0.95 }}
      >
        {encumbrance} / {maxEncumbrance}
      </Typography>

      <Divider sx={{ borderColor: 'rgba(255, 62, 181, 0.4)', mb: 0.95 }} />

      {!hasVisibleItems ? (
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
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0.45,
            maxHeight: 220,
            overflowY: 'auto',
            pr: 0.4,
          }}
        >
          {visibleGroups.map((group) => (
            <Box key={group.key}>
              {group.label && (
                <Typography
                  sx={{
                    color: morkBorgColors.pink,
                    fontFamily: "'Antonio', sans-serif",
                    fontSize: '0.62rem',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    mt: 0.35,
                    mb: 0.25,
                  }}
                >
                  {resolveGroupLabel
                    ? resolveGroupLabel(group.label)
                    : group.label}
                </Typography>
              )}
              {group.items.map((item, index) => (
                <SummaryListItemRow
                  key={`${group.key}-${item.key ?? 'enc-item'}-${index}`}
                  label={getItemLabel(item, unknownItemLabel)}
                />
              ))}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
