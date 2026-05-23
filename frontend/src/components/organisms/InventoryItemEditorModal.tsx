import { useId, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, TextField } from '@mui/material';
import { type AggregatedItem } from '@/utils/aggregateItems';
import { type EquipmentItem } from '@/hooks/models';
import { useCharacter } from '@/CharacterContext/CharacterContext';
import { customStyles } from '@/theme/morkBorgTheme';
import { MorkBorgModal } from '@components/index';
import PanelHeading from './customItem/PanelHeading';
import ItemIdentityHeader from './inventoryItem/ItemIdentityHeader';
import QuantityStepper from './inventoryItem/QuantityStepper';
import InventoryItemActionTray from './inventoryItem/InventoryItemActionTray';
import EquipSlotButton from './inventoryItem/EquipSlotButton';
import { useInventoryItemEditor } from '@/hooks/useInventoryItemEditor';

export type InventoryLocation = 'equipment' | 'storage';

interface InventoryItemEditorModalProps {
  open: boolean;
  aggregated: AggregatedItem<EquipmentItem> | null;
  location: InventoryLocation;
  onClose: () => void;
  onUpdate: (indices: number[], updated: EquipmentItem) => void;
  onDelete: (indices: number[]) => void;
  onMove: (indices: number[]) => void;
  onAdjustQuantity: (
    item: EquipmentItem,
    newTotal: number,
    currentIndices: number[],
  ) => void;
}

const modalInputStyles = customStyles.modal.input;
const sectionGap = { mt: 2.5 } as const;
const equipGridStyle = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
  gap: 1,
  mt: 1,
} as const;

export default function InventoryItemEditorModal({
  open,
  aggregated,
  location,
  onClose,
  onUpdate,
  onDelete,
  onMove,
  onAdjustQuantity,
}: InventoryItemEditorModalProps) {
  const { t } = useTranslation();
  const { character, equipWeapon, equipArmor } = useCharacter();
  const formId = useId();

  const editor = useInventoryItemEditor(aggregated, open, {
    onUpdate,
    onDelete,
    onAdjustQuantity,
    onClose,
  });

  if (!aggregated || !editor.item) return null;

  const { item, indices, localQuantity, setLocalQuantity } = editor;
  const tags = item.tags ?? [];
  const isArmor = tags.includes('armor');
  const isWeaponOrShield = tags.includes('weapon') || tags.includes('shield');
  const isOnHand = location === 'equipment';
  const moveLabel = isOnHand
    ? t('equipment.moveToStorage')
    : t('equipment.moveToOnHand');
  const quantityCacheKey = `${location}:${item.key ?? item.name ?? 'item'}:${indices[0] ?? 0}`;
  const equippedWeapons = character?.equippedWeapons ?? [];
  const equippedArmor = character?.equippedArmor;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    editor.save();
  };

  return (
    <MorkBorgModal
      open={open}
      onClose={onClose}
      title={t('equipment.itemDetails')}
      maxWidth="md"
      actions={
        <>
          <Button onClick={onClose}>{t('actions.cancel')}</Button>
          <Button type="submit" form={formId} variant="contained">
            {t('equipment.save')}
          </Button>
        </>
      }
    >
      <Box
        component="form"
        id={formId}
        onSubmit={handleSubmit}
        sx={customStyles.inventorySection.modalContent}
      >
        <ItemIdentityHeader
          displayName={editor.editName}
          unnamedFallback={t('equipment.unnamedItem', 'Unnamed item')}
          item={item}
        />

        <TextField
          fullWidth
          label={t('equipment.itemName')}
          value={editor.editName}
          onChange={(event) => editor.setEditName(event.target.value)}
          sx={modalInputStyles}
        />

        <QuantityStepper
          value={localQuantity}
          onChange={setLocalQuantity}
          cacheKey={`${quantityCacheKey}:modal`}
        />

        <TextField
          fullWidth
          multiline
          rows={2}
          label={t('character.description')}
          value={editor.editDescription}
          onChange={(event) => editor.setEditDescription(event.target.value)}
          sx={modalInputStyles}
        />
        <TextField
          fullWidth
          multiline
          rows={2}
          label={t('equipment.comments', 'Comments / Notes')}
          value={editor.editComments}
          onChange={(event) => editor.setEditComments(event.target.value)}
          sx={modalInputStyles}
        />

        {isOnHand && (isArmor || isWeaponOrShield) && (
          <Box sx={sectionGap}>
            <PanelHeading>{t('equipment.equip', 'Equip')}</PanelHeading>
            <Box sx={equipGridStyle}>
              {isArmor && (
                <EquipSlotButton
                  slotLabel={t('equipment.armorLabel', 'Armor')}
                  currentItemName={equippedArmor?.name}
                  onClick={() => {
                    equipArmor(indices[0]);
                    onClose();
                  }}
                  dataTestId="equip-armor-slot"
                />
              )}
              {isWeaponOrShield && (
                <>
                  <EquipSlotButton
                    slotLabel={t('equipment.mainHand', 'Main hand')}
                    currentItemName={equippedWeapons[0]?.name}
                    onClick={() => {
                      equipWeapon(indices[0], 0);
                      onClose();
                    }}
                    dataTestId="equip-weapon-slot-0"
                  />
                  <EquipSlotButton
                    slotLabel={t('equipment.offHand', 'Off hand')}
                    currentItemName={equippedWeapons[1]?.name}
                    onClick={() => {
                      equipWeapon(indices[0], 1);
                      onClose();
                    }}
                    dataTestId="equip-weapon-slot-1"
                  />
                </>
              )}
            </Box>
          </Box>
        )}

        <Box sx={sectionGap}>
          <InventoryItemActionTray
            moveLabel={moveLabel}
            onMove={() => {
              onMove(indices);
              onClose();
            }}
            onSell={editor.sell}
            onDrop={() => {
              onDelete(indices);
              onClose();
            }}
            sellPrice={editor.sellPrice}
            sellTotal={editor.sellTotal}
            quantity={localQuantity}
          />
        </Box>
      </Box>
    </MorkBorgModal>
  );
}
