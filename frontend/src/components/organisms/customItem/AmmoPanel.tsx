import { Autocomplete, Box, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { BoundedTextField } from './BoundedTextField';
import PanelHeading from './PanelHeading';
import { type CustomItemPanelProps } from './panelProps';
import { modalInputStyles, panelStyle, sectionGap, tightPairStyle } from './panelStyles';

type AmmoPanelProps = CustomItemPanelProps & {
  ammoTypes: string[];
};

export default function AmmoPanel({
  state,
  update,
  fieldErrors,
  ammoTypes,
}: AmmoPanelProps) {
  const { t } = useTranslation();

  return (
    <Box sx={{ ...sectionGap, ...panelStyle }}>
      <PanelHeading>{t('equipment.customItem.ammo')}</PanelHeading>
      <Box sx={tightPairStyle}>
        <Autocomplete
          freeSolo
          options={ammoTypes}
          inputValue={state.ammoType}
          onInputChange={(_event, nextValue) => update('ammoType', nextValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('equipment.customItem.ammoType', 'Ammo type')}
              helperText={t('equipment.customItem.ammoTypeHint2', 'e.g. Arrow, Bolt')}
              sx={modalInputStyles}
            />
          )}
        />
        <BoundedTextField
          field="ammoAmount"
          state={state.ammoAmount}
          fieldErrors={fieldErrors}
          label={t('equipment.customItem.amount', 'Amount')}
          helperText={t('equipment.customItem.amountHint', 'Pieces in this stack')}
          onChange={(event) => update('ammoAmount', event.target.value)}
        />
      </Box>
    </Box>
  );
}
