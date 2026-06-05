import { Box, MenuItem, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { statOptions } from '@components/modifiers/config';
import { type Statistic } from '@/hooks/models';
import { BoundedTextField } from './BoundedTextField';
import PanelHeading from './PanelHeading';
import { type CustomItemPanelProps } from './panelProps';
import { modalInputStyles, panelStyle, sectionGap, tightPairStyle } from './panelStyles';

export default function ConsumablePanel({
  state,
  update,
  fieldErrors,
}: CustomItemPanelProps) {
  const { t } = useTranslation();

  return (
    <Box sx={{ ...sectionGap, ...panelStyle }}>
      <PanelHeading>{t('equipment.customItem.consumable')}</PanelHeading>
      <Box sx={tightPairStyle}>
        <TextField
          select
          label={t('equipment.customItem.consumeCount', 'Use count')}
          value={state.consumeMode}
          onChange={(event) =>
            update('consumeMode', event.target.value as 'fixed' | 'fixedPlusModifier')
          }
          helperText={t('equipment.customItem.consumeCountHint', 'How many uses before depleted')}
          sx={modalInputStyles}
        >
          <MenuItem value="fixed">
            {t('equipment.customItem.consumeModes.fixed', 'Fixed')}
          </MenuItem>
          <MenuItem value="fixedPlusModifier">
            {t('equipment.customItem.consumeModes.fixedPlusModifier', 'Fixed + stat')}
          </MenuItem>
        </TextField>
        <BoundedTextField
          field="consumeBase"
          state={state.consumeBase}
          fieldErrors={fieldErrors}
          label={t('equipment.customItem.baseUses', 'Base uses')}
          helperText={t('equipment.customItem.baseUsesHint', 'Pips before depletion')}
          onChange={(event) => update('consumeBase', event.target.value)}
        />
      </Box>
      {state.consumeMode === 'fixedPlusModifier' && (
        <TextField
          select
          label={t('equipment.customItem.statistic', 'Statistic')}
          value={state.consumeStatistic}
          onChange={(event) => update('consumeStatistic', event.target.value as Statistic)}
          helperText={t(
            'equipment.customItem.statisticHint',
            "Bonus pips equal to this stat's modifier"
          )}
          sx={modalInputStyles}
        >
          {statOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {t(`attributes.${option.value}`, option.label)}
            </MenuItem>
          ))}
        </TextField>
      )}
    </Box>
  );
}
