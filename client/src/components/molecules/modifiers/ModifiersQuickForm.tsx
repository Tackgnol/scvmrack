import { morkBorgColors } from '@/theme/morkBorgTheme';
import { type LocalStatistic, type ScopeOption } from '@components/modifiers/types';
import { scopeIncludeOptions, statOptions } from '@components/modifiers/config';
import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  type SelectChangeEvent,
} from '@mui/material';
import { type ChangeEvent, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

interface ModifiersQuickFormProps {
  name: string;
  stat: LocalStatistic;
  valueStr: string;
  scope: ScopeOption;
  onNameChange: (value: string) => void;
  onStatChange: (value: LocalStatistic) => void;
  onValueChange: (value: string) => void;
  onScopeChange: (value: ScopeOption) => void;
  onSubmit: () => void;
  onOpenAdvanced: () => void;
}

export default function ModifiersQuickForm({
  name,
  stat,
  valueStr,
  scope,
  onNameChange,
  onStatChange,
  onValueChange,
  onScopeChange,
  onSubmit,
  onOpenAdvanced,
}: ModifiersQuickFormProps) {
  const { t } = useTranslation();

  const handleEnterSubmit = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter') {
      onSubmit();
    }
  };

  return (
    <Box
      className="print-hidden"
      sx={{
        mt: 2,
        pt: 2,
        borderTop: `2px solid ${morkBorgColors.grey}`,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr auto auto auto auto auto' },
        gridTemplateRows: { xs: 'auto auto auto auto', sm: 'auto' },
        gap: { xs: 1, sm: 0.75 },
        alignItems: 'center',
      }}
    >
      <TextField
        placeholder={t('modifiers.namePlaceholder')}
        value={name}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onNameChange(event.target.value)
        }
        onKeyDown={handleEnterSubmit}
        size="small"
        sx={{
          gridColumn: { xs: '1 / -1', sm: 'auto' },
          gridRow: { xs: 1, sm: 'auto' },
          '& .MuiOutlinedInput-root': {
            fontFamily: "'Antonio', sans-serif",
            fontSize: { xs: '0.9rem', sm: '0.8rem' },
            letterSpacing: '0.05em',
          },
        }}
        slotProps={{
          htmlInput: {
            'data-testid': 'quick-mod-name-input',
            'aria-label': t('modifiers.name'),
          },
        }}
      />

      <Select
        value={stat}
        onChange={(event: SelectChangeEvent<LocalStatistic>) =>
          onStatChange(event.target.value as LocalStatistic)
        }
        slotProps={{ htmlInput: { 'aria-label': t('modifiers.statistic', 'Modifier statistic') } }}
        size="small"
        sx={{
          gridColumn: { xs: '1 / 2', sm: 'auto' },
          gridRow: { xs: 2, sm: 'auto' },
          bgcolor: morkBorgColors.grey,
          color: morkBorgColors.yellow,
          minWidth: { xs: 0, sm: 75 },
          width: { xs: '100%', sm: 'auto' },
          '& .MuiSelect-select': {
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: { xs: '0.95rem', sm: '0.85rem' },
            letterSpacing: '0.1em',
          },
        }}
      >
        {statOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>

      <TextField
        type="number"
        placeholder="+1"
        value={valueStr}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onValueChange(event.target.value)
        }
        onKeyDown={handleEnterSubmit}
        size="small"
        sx={{
          gridColumn: { xs: '2 / 3', sm: 'auto' },
          gridRow: { xs: 2, sm: 'auto' },
          width: { xs: '100%', sm: 60 },
          '& .MuiOutlinedInput-root': {
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: { xs: '1rem', sm: '0.9rem' },
            textAlign: 'center',
          },
        }}
        slotProps={{
          htmlInput: {
            'data-testid': 'quick-mod-value-input',
            'aria-label': t('modifiers.value'),
          },
        }}
      />

      <Select
        value={scope}
        onChange={(event: SelectChangeEvent<ScopeOption>) =>
          onScopeChange(event.target.value as ScopeOption)
        }
        slotProps={{ htmlInput: { 'aria-label': t('modifiers.scope') } }}
        size="small"
        sx={{
          gridColumn: { xs: '1 / 2', sm: 'auto' },
          gridRow: { xs: 3, sm: 'auto' },
          bgcolor: morkBorgColors.grey,
          color: morkBorgColors.yellow,
          minWidth: { xs: 0, sm: 90 },
          width: { xs: '100%', sm: 'auto' },
          '& .MuiSelect-select': {
            fontFamily: "'Antonio', sans-serif",
            fontSize: { xs: '0.72rem', sm: '0.6rem' },
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          },
        }}
      >
        {scopeIncludeOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {t(option.labelKey)}
          </MenuItem>
        ))}
      </Select>

      <Button
        variant="contained"
        onClick={onSubmit}
        data-testid="quick-mod-add-btn"
        sx={{
          gridColumn: { xs: '2 / 3', sm: 'auto' },
          gridRow: { xs: 3, sm: 'auto' },
          minWidth: 'auto',
          minHeight: { xs: 44, sm: 36 },
          px: 2.5,
          bgcolor: morkBorgColors.yellow,
          color: morkBorgColors.black,
          fontFamily: "'Antonio', sans-serif",
          fontSize: { xs: '0.8rem', sm: '0.7rem' },
          fontWeight: 'bold',
          letterSpacing: '0.15em',
          boxShadow: `2px 2px 0 ${morkBorgColors.pink}`,
          '&:hover': {
            bgcolor: morkBorgColors.pink,
            color: morkBorgColors.black,
            transform: 'translate(-1px, -1px)',
            boxShadow: `3px 3px 0 ${morkBorgColors.yellow}`,
          },
        }}
      >
        {t('modifiers.addModifier')}
      </Button>

      <Tooltip title={t('modifiers.advancedTooltip')} placement="top">
        <IconButton
          onClick={onOpenAdvanced}
          aria-label={t('modifiers.advancedTooltip')}
          data-testid="advanced-mod-btn"
          sx={{
            gridColumn: { xs: '1 / -1', sm: 'auto' },
            gridRow: { xs: 4, sm: 'auto' },
            justifySelf: 'center',
            width: { xs: 44, sm: 36 },
            height: { xs: 44, sm: 36 },
            borderRadius: 0,
            border: `2px solid ${morkBorgColors.yellow}`,
            bgcolor: 'transparent',
            color: morkBorgColors.yellow,
            fontFamily: "'Antonio', sans-serif",
            fontSize: { xs: '1.1rem', sm: '1rem' },
            lineHeight: 1,
            transition:
              'transform 140ms ease, box-shadow 140ms ease, color 140ms ease',
            '&:hover': {
              bgcolor: morkBorgColors.yellow,
              color: morkBorgColors.black,
              transform: 'translate(-1px, -1px)',
              boxShadow: `2px 2px 0 ${morkBorgColors.pink}`,
            },
          }}
        >
          ✠
        </IconButton>
      </Tooltip>
    </Box>
  );
}
