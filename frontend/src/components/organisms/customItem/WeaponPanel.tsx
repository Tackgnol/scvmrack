import { Autocomplete, Box, MenuItem, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { CUSTOM_DAMAGE_DICE } from '@/inventory/customItems';
import { BoundedTextField } from './BoundedTextField';
import PanelHeading from './PanelHeading';
import { type CustomItemPanelProps } from './panelProps';
import { modalInputStyles, panelStyle, sectionGap, tightPairStyle } from './panelStyles';

type WeaponPanelProps = CustomItemPanelProps & {
  ammoTypes: string[];
};

export default function WeaponPanel({
  state,
  update,
  fieldErrors,
  ammoTypes,
}: WeaponPanelProps) {
  const { t } = useTranslation();

  return (
    <Box sx={{ ...sectionGap, ...panelStyle }}>
      <PanelHeading>{t('equipment.customItem.weapon')}</PanelHeading>
      <Box sx={tightPairStyle}>
        <TextField
          select
          label={t('equipment.customItem.damageDie', 'Damage die')}
          value={state.damageDie}
          onChange={(event) => update('damageDie', event.target.value)}
          helperText={t('equipment.customItem.damageDieHint', 'Rolled when this weapon hits')}
          sx={modalInputStyles}
        >
          {CUSTOM_DAMAGE_DICE.map((die) => (
            <MenuItem key={die} value={String(die)}>
              d{die}
            </MenuItem>
          ))}
        </TextField>
        <Autocomplete
          freeSolo
          options={ammoTypes}
          inputValue={state.ammoType}
          onInputChange={(_event, nextValue) => update('ammoType', nextValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('equipment.customItem.ammoType', 'Ammo type')}
              helperText={t('equipment.customItem.ammoTypeHint', 'Leave blank for melee')}
              sx={modalInputStyles}
            />
          )}
        />
      </Box>
      {state.ammoType.trim() && (
        <BoundedTextField
          field="ammoAmount"
          state={state.ammoAmount}
          fieldErrors={fieldErrors}
          label={t('equipment.customItem.addAmmo', 'Add ammo')}
          helperText={t(
            'equipment.customItem.addAmmoHint',
            'Bundled stack — merges with existing of the same type'
          )}
          onChange={(event) => update('ammoAmount', event.target.value)}
        />
      )}
    </Box>
  );
}
