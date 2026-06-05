import { Box, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { type UseCustomItemForm } from '@/hooks/useCustomItemForm';
import { BoundedTextField } from './BoundedTextField';
import PanelHeading from './PanelHeading';
import {
  identityGridStyle,
  modalInputStyles,
  panelStyle,
  sectionGap,
  stackStyle,
} from './panelStyles';

type IdentityPanelProps = Pick<
  UseCustomItemForm,
  'state' | 'update' | 'fieldErrors' | 'textErrors' | 'showQuantity'
>;

export default function IdentityPanel({
  state,
  update,
  fieldErrors,
  textErrors,
  showQuantity,
}: IdentityPanelProps) {
  const { t } = useTranslation();

  return (
    <Box sx={{ ...sectionGap, ...panelStyle }}>
      <PanelHeading>{t('equipment.customItem.identity', 'Identity')}</PanelHeading>
      <Box sx={identityGridStyle}>
        <TextField
          required
          label={t('equipment.itemName')}
          value={state.name}
          error={textErrors.name}
          onChange={(event) => update('name', event.target.value)}
          sx={modalInputStyles}
        />
        <BoundedTextField
          field="value"
          state={state.value}
          fieldErrors={fieldErrors}
          label={t('equipment.customItem.value', 'Value')}
          helperText={t('equipment.customItem.valueHint', 'Silver pieces')}
          onChange={(event) => update('value', event.target.value)}
        />
      </Box>
      {showQuantity && (
        <BoundedTextField
          field="quantity"
          state={state.quantity}
          fieldErrors={fieldErrors}
          label={t('equipment.quantity')}
          helperText={t('equipment.customItem.quantityHint', 'How many copies')}
          onChange={(event) => update('quantity', event.target.value)}
        />
      )}
      <Box sx={stackStyle}>
        <TextField
          multiline
          rows={2}
          label={t('character.description')}
          value={state.description}
          error={textErrors.description}
          onChange={(event) => update('description', event.target.value)}
          sx={modalInputStyles}
        />
        <TextField
          multiline
          rows={2}
          label={t('equipment.customItem.comments', 'Comments')}
          value={state.comments}
          error={textErrors.comments}
          onChange={(event) => update('comments', event.target.value)}
          sx={modalInputStyles}
        />
      </Box>
    </Box>
  );
}
