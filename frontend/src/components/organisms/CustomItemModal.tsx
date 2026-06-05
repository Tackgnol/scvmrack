import { type FormEvent, useId } from 'react';
import { useTranslation } from 'react-i18next';
import AddIcon from '@mui/icons-material/Add';
import { Box, Button } from '@mui/material';
import { type EquipmentItem, type Character } from '@/hooks/models';
import { customStyles } from '@/theme/morkBorgTheme';
import { MorkBorgModal } from '@components/index';
import { useCustomItemForm } from '@/hooks/useCustomItemForm';
import { getTextLimitMessage } from '@/validation/characterUpdate';
import { useValidationAlert } from '@/hooks/useValidationAlert';
import KindSelector from './customItem/KindSelector';
import CustomItemPreview from './customItem/CustomItemPreview';
import IdentityPanel from './customItem/IdentityPanel';
import WeaponPanel from './customItem/WeaponPanel';
import AmmoPanel from './customItem/AmmoPanel';
import ArmorPanel from './customItem/ArmorPanel';
import ConsumablePanel from './customItem/ConsumablePanel';
import CustomItemModifierPanel from './customItem/CustomItemModifierPanel';
import { sectionGap } from './customItem/panelStyles';

interface CustomItemModalProps {
  open: boolean;
  character: Character | null | undefined;
  ammoTypes: string[];
  onClose: () => void;
  onCreate: (items: EquipmentItem[]) => void;
}

export default function CustomItemModal({
  open,
  character,
  ammoTypes,
  onClose,
  onCreate,
}: CustomItemModalProps) {
  const { t } = useTranslation();
  const formId = useId();
  const {
    state,
    update,
    handleKindChange,
    handleArmorPresetChange,
    canSave,
    showModifierPanel,
    showQuantity,
    buildBundle,
    previewItems,
    fieldErrors,
    textErrors,
  } = useCustomItemForm(open, character);
  const nameErrorMessage = getTextLimitMessage(t, 'itemName', state.name);
  const descriptionErrorMessage = getTextLimitMessage(
    t,
    'itemDescription',
    state.description,
  );
  const commentsErrorMessage = getTextLimitMessage(
    t,
    'itemComments',
    state.comments,
  );
  useValidationAlert(nameErrorMessage);
  useValidationAlert(descriptionErrorMessage);
  useValidationAlert(commentsErrorMessage);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSave) return;
    const items = buildBundle();
    if (items.length === 0) return;
    onCreate(items);
    onClose();
  };

  return (
    <MorkBorgModal
      open={open}
      onClose={onClose}
      title={t('equipment.customItem.title', 'Forge an Item')}
      maxWidth="md"
      actions={
        <>
          <Button onClick={onClose}>{t('actions.cancel')}</Button>
          <Button
            startIcon={<AddIcon />}
            type="submit"
            form={formId}
            variant="contained"
            disabled={!canSave}
          >
            {t('equipment.customItem.create', 'Forge')}
          </Button>
        </>
      }
    >
      <Box
        component="form"
        id={formId}
        onSubmit={handleSubmit}
        sx={customStyles.inventorySection.modalContent}
        // Wrapping in a form gives Enter-to-submit and lets the action
        // button live in the modal footer (outside the children tree)
        // via `form={formId}`.
      >
        <KindSelector value={state.kind} onChange={handleKindChange} />

        <Box sx={sectionGap}>
          <CustomItemPreview items={previewItems} kind={state.kind} />
        </Box>

        <IdentityPanel
          state={state}
          update={update}
          fieldErrors={fieldErrors}
          textErrors={textErrors}
          showQuantity={showQuantity}
        />

        {state.kind === 'weapon' && (
          <WeaponPanel
            state={state}
            update={update}
            fieldErrors={fieldErrors}
            ammoTypes={ammoTypes}
          />
        )}

        {state.kind === 'ammo' && (
          <AmmoPanel
            state={state}
            update={update}
            fieldErrors={fieldErrors}
            ammoTypes={ammoTypes}
          />
        )}

        {state.kind === 'armor' && (
          <ArmorPanel
            state={state}
            update={update}
            fieldErrors={fieldErrors}
            handleArmorPresetChange={handleArmorPresetChange}
          />
        )}

        {state.kind === 'consumable' && (
          <ConsumablePanel state={state} update={update} fieldErrors={fieldErrors} />
        )}

        {showModifierPanel && (
          <CustomItemModifierPanel
            state={state}
            update={update}
            fieldErrors={fieldErrors}
          />
        )}
      </Box>
    </MorkBorgModal>
  );
}
