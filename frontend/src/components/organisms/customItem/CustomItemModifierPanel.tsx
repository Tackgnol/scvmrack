import {
  Box,
  Checkbox,
  FormControlLabel,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { scopeIncludeOptions, statOptions } from '@components/modifiers/config';
import { type ScopeOption } from '@components/modifiers/types';
import { type Statistic } from '@/hooks/models';
import { BoundedTextField } from './BoundedTextField';
import PanelHeading from './PanelHeading';
import { type CustomItemPanelProps } from './panelProps';
import { modalInputStyles, panelStyle, sectionGap, tightPairStyle } from './panelStyles';

export default function CustomItemModifierPanel({
  state,
  update,
  fieldErrors,
}: CustomItemPanelProps) {
  const { t } = useTranslation();

  return (
    <Box sx={{ ...sectionGap, ...panelStyle }}>
      <PanelHeading>{t('equipment.customItem.modifierHeading', 'Modifier')}</PanelHeading>
      <FormControlLabel
        control={
          <Checkbox
            checked={state.modifierEnabled}
            onChange={(event) => update('modifierEnabled', event.target.checked)}
          />
        }
        label={
          <Box component="span">
            <Typography component="span" sx={{ display: 'block' }}>
              {t('equipment.customItem.appliesModifier', 'Grants a modifier while equipped')}
            </Typography>
            <Typography
              component="span"
              sx={{ display: 'block', color: '#6b6b6b', fontSize: '0.72rem' }}
            >
              {t(
                'equipment.customItem.appliesModifierHint',
                'Adds a roll modifier to a chosen stat'
              )}
            </Typography>
          </Box>
        }
      />
      {state.modifierEnabled && (
        <>
          <Box sx={tightPairStyle}>
            <BoundedTextField
              field="modifierValue"
              state={state.modifierValue}
              fieldErrors={fieldErrors}
              label={t('modifiers.value')}
              helperText={t('equipment.customItem.modifierValueHint', '+ helps, − hinders')}
              onChange={(event) => update('modifierValue', event.target.value)}
            />
            <TextField
              select
              label={t('modifiers.statistic')}
              value={state.modifierStatistic}
              onChange={(event) =>
                update('modifierStatistic', event.target.value as Statistic)
              }
              sx={modalInputStyles}
            >
              {statOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {t(`attributes.${option.value}`, option.label)}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <TextField
            select
            label={t('equipment.customItem.modifierAppliesTo', 'Applies to')}
            value={state.modifierScope}
            onChange={(event) => update('modifierScope', event.target.value as ScopeOption)}
            helperText={t(
              'equipment.customItem.modifierAppliesToHint',
              'Which rolls this modifier affects'
            )}
            sx={modalInputStyles}
          >
            {scopeIncludeOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {t(option.labelKey, option.value)}
              </MenuItem>
            ))}
          </TextField>
        </>
      )}
    </Box>
  );
}
