import { Box, Divider, Typography } from '@mui/material';
import {
  type CombatBreakdown,
  type DecoratedModifier,
} from '@/hooks/useSummaryMetrics';
import { morkBorgColors } from '@/theme/morkBorgTheme';
import SummaryBreakdownValueRow from './SummaryBreakdownValueRow';
import SummaryModifierRow from './SummaryModifierRow';

interface SummaryCombatBreakdownProps {
  title: string;
  abilityModifier: number;
  currentDr: number;
  breakdown: CombatBreakdown;
  unknownOriginLabel: string;
  modifiersLabel: string;
  noModifiersLabel: string;
  statLabel: string;
}

const formatSigned = (value: number): string => {
  if (value > 0) return `+${value}`;
  return `${value}`;
};

const getModifierName = (
  modifier: DecoratedModifier,
  fallbackLabel: string,
): string => {
  if ('originName' in modifier && modifier.originName) return modifier.originName;
  if ('name' in modifier && modifier.name) return modifier.name;
  if (modifier.source) return modifier.source;
  return fallbackLabel;
};

export default function SummaryCombatBreakdown({
  title,
  abilityModifier,
  currentDr,
  breakdown,
  unknownOriginLabel,
  modifiersLabel,
  noModifiersLabel,
  statLabel,
}: SummaryCombatBreakdownProps) {
  const abilityContribution = -abilityModifier;
  const modifiersContribution = -breakdown.modifierTotal;

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

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 0.4, mb: 1.1 }}>
        <SummaryBreakdownValueRow label="Base DR" value="12" />
        <SummaryBreakdownValueRow
          label={`${statLabel} mod`}
          value={formatSigned(abilityContribution)}
        />
        <SummaryBreakdownValueRow
          label={modifiersLabel}
          value={formatSigned(modifiersContribution)}
        />
      </Box>

      <Divider sx={{ borderColor: 'rgba(255, 62, 181, 0.4)', mb: 0.95 }} />

      <Typography
        sx={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '1.04rem',
          color: morkBorgColors.yellow,
          letterSpacing: '0.06em',
          mb: 0.75,
        }}
      >
        DR {currentDr}
      </Typography>

      {breakdown.applicable.length === 0 ? (
        <Typography
          sx={{
            color: 'rgba(245,245,245,0.66)',
            fontStyle: 'italic',
            fontSize: '0.78rem',
          }}
        >
          {noModifiersLabel}
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.45 }}>
          {breakdown.applicable.map((modifier) => (
            <SummaryModifierRow
              key={modifier.listKey}
              label={getModifierName(modifier, unknownOriginLabel)}
              value={modifier.value ?? 0}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
