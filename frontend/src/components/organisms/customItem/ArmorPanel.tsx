import { Box, MenuItem, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { CUSTOM_ARMOR_DICE, type ArmorPreset } from '@/inventory/customItems';
import { type UseCustomItemForm } from '@/hooks/useCustomItemForm';
import { BoundedTextField } from './BoundedTextField';
import PanelHeading from './PanelHeading';
import { type CustomItemPanelProps } from './panelProps';
import { modalInputStyles, panelStyle, sectionGap, tightPairStyle } from './panelStyles';

const armorPresets: ArmorPreset[] = ['light', 'medium', 'heavy'];

type ArmorPanelProps = CustomItemPanelProps &
  Pick<UseCustomItemForm, 'handleArmorPresetChange'>;

export default function ArmorPanel({
  state,
  update,
  fieldErrors,
  handleArmorPresetChange,
}: ArmorPanelProps) {
  const { t } = useTranslation();

  return (
    <Box sx={{ ...sectionGap, ...panelStyle }}>
      <PanelHeading>{t('equipment.customItem.armor')}</PanelHeading>
      <Box sx={tightPairStyle}>
        <TextField
          select
          label={t('equipment.customItem.armorTier', 'Armor tier')}
          value={state.armorPreset}
          onChange={(event) =>
            handleArmorPresetChange(event.target.value as ArmorPreset)
          }
          helperText={t('equipment.customItem.armorPresetHint', 'Picks the default die + tier')}
          sx={modalInputStyles}
        >
          {armorPresets.map((preset) => (
            <MenuItem key={preset} value={preset}>
              {t(
                `equipment.customItem.armorPresets.${preset}`,
                preset.charAt(0).toUpperCase() + preset.slice(1)
              )}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label={t('equipment.customItem.armorDie', 'Protection die')}
          value={state.armorDie}
          onChange={(event) => update('armorDie', event.target.value)}
          helperText={t('equipment.customItem.armorDieHint', 'Rolled when armor absorbs damage')}
          sx={modalInputStyles}
        >
          {CUSTOM_ARMOR_DICE.map((die) => (
            <MenuItem key={die} value={String(die)}>
              d{die}
            </MenuItem>
          ))}
        </TextField>
      </Box>
      <BoundedTextField
        field="armorTier"
        state={state.armorTier}
        fieldErrors={fieldErrors}
        label={t('equipment.customItem.maxTier', 'Max tier')}
        helperText={t('equipment.customItem.maxTierHint', '0 destroyed · 4 pristine')}
        onChange={(event) => update('armorTier', event.target.value)}
      />
    </Box>
  );
}
