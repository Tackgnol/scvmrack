import { morkBorgColors } from '@/theme/morkBorgTheme';
import {
  type IncludeContext,
  type LocalStatistic,
  type ScopeOption,
} from '@components/modifiers/types';
import { allIncludeOptions, scopeIncludeOptions, statOptions } from '@components/modifiers/config';
import { MorkBorgModal } from '@components/index';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  type SelectChangeEvent,
} from '@mui/material';
import { type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';

interface ModifierAdvancedModalProps {
  open: boolean;
  isEditing: boolean;
  canSave: boolean;
  name: string;
  stat: LocalStatistic;
  valueStr: string;
  scope: ScopeOption;
  includes: IncludeContext[];
  comment: string;
  onClose: () => void;
  onSave: () => void;
  onNameChange: (value: string) => void;
  onStatChange: (value: LocalStatistic) => void;
  onValueChange: (value: string) => void;
  onScopeChange: (value: ScopeOption) => void;
  onToggleInclude: (value: IncludeContext, checked: boolean) => void;
  onCommentChange: (value: string) => void;
}

export default function ModifierAdvancedModal({
  open,
  isEditing,
  canSave,
  name,
  stat,
  valueStr,
  scope,
  includes,
  comment,
  onClose,
  onSave,
  onNameChange,
  onStatChange,
  onValueChange,
  onScopeChange,
  onToggleInclude,
  onCommentChange,
}: ModifierAdvancedModalProps) {
  const { t } = useTranslation();

  return (
    <MorkBorgModal
      open={open}
      onClose={onClose}
      maxWidth="xs"
      title={
        isEditing ? t('modifiers.modal.editTitle') : t('modifiers.modal.title')
      }
      actions={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            onClick={onSave}
            disabled={!canSave}
            data-testid="modal-mod-save-btn"
          >
            {isEditing ? t('modifiers.saveModifier') : t('modifiers.addModifier')}
          </Button>
        </>
      }
    >
      <TextField
        label={t('modifiers.name')}
        value={name}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onNameChange(event.target.value)
        }
        fullWidth
        autoFocus
        sx={{ mt: 0.5 }}
        InputLabelProps={{
          sx: {
            color: morkBorgColors.pink,
            '&.Mui-focused': { color: morkBorgColors.yellow },
          },
        }}
        InputProps={{ sx: { color: morkBorgColors.white } }}
        inputProps={{ 'data-testid': 'modal-mod-name-input' }}
      />

      <Select
        value={stat}
        onChange={(event: SelectChangeEvent<LocalStatistic>) =>
          onStatChange(event.target.value as LocalStatistic)
        }
        inputProps={{ 'aria-label': t('modifiers.statistic', 'Modifier statistic') }}
        fullWidth
        displayEmpty
        sx={{
          bgcolor: morkBorgColors.darkGrey,
          color: morkBorgColors.yellow,
          '& .MuiSelect-select': {
            fontFamily: "'Antonio', sans-serif",
            textTransform: 'uppercase',
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
        label={t('modifiers.value')}
        type="number"
        value={valueStr}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onValueChange(event.target.value)
        }
        fullWidth
        placeholder="+1"
        InputLabelProps={{
          sx: {
            color: morkBorgColors.pink,
            '&.Mui-focused': { color: morkBorgColors.yellow },
          },
        }}
        InputProps={{ sx: { color: morkBorgColors.white } }}
      />

      <Select
        value={scope}
        onChange={(event: SelectChangeEvent<ScopeOption>) =>
          onScopeChange(event.target.value as ScopeOption)
        }
        inputProps={{ 'aria-label': t('modifiers.scope') }}
        fullWidth
        displayEmpty
        sx={{
          bgcolor: morkBorgColors.darkGrey,
          color: morkBorgColors.yellow,
          '& .MuiSelect-select': {
            fontFamily: "'Antonio', sans-serif",
            textTransform: 'uppercase',
          },
        }}
      >
        {scopeIncludeOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {t(option.labelKey)}
          </MenuItem>
        ))}
      </Select>

      <Box>
        <Typography
          sx={{
            color: morkBorgColors.pink,
            fontSize: { xs: '0.82rem', sm: '0.75rem' },
            mb: 1,
          }}
        >
          {t('modifiers.exclude.title')}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: '#999',
            mb: 1.5,
            fontSize: { xs: '0.8rem', sm: '0.7rem' },
          }}
        >
          {t('modifiers.exclude.description')}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {allIncludeOptions.map((option) => (
            <FormControlLabel
              key={option.value}
              control={
                <Checkbox
                  checked={includes.includes(option.value)}
                  onChange={(event) =>
                    onToggleInclude(option.value, event.target.checked)
                  }
                  sx={{
                    color: morkBorgColors.yellow,
                    '&.Mui-checked': {
                      color: morkBorgColors.yellow,
                    },
                  }}
                />
              }
              label={t(option.labelKey)}
              sx={{
                color: morkBorgColors.white,
                '& .MuiFormControlLabel-label': {
                  fontSize: { xs: '0.9rem', sm: '0.8rem' },
                },
              }}
            />
          ))}
        </Box>
      </Box>

      <TextField
        label={t('modifiers.comment')}
        value={comment}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onCommentChange(event.target.value)
        }
        fullWidth
        multiline
        rows={2}
        InputLabelProps={{
          sx: {
            color: morkBorgColors.pink,
            '&.Mui-focused': { color: morkBorgColors.yellow },
          },
        }}
        InputProps={{ sx: { color: morkBorgColors.white } }}
      />
    </MorkBorgModal>
  );
}
