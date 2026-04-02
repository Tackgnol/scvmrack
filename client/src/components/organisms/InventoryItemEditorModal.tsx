import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, TextField, Typography } from '@mui/material';
import { type AggregatedItem } from '@/utils/aggregateItems';
import { type EquipmentItem } from '@/hooks/models';
import { useCharacter } from '@/CharacterContext/CharacterContext';
import { customStyles } from '@/theme/morkBorgTheme';
import {
  AnimatedNumber,
  MorkBorgModal,
} from '@components/index';

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
const counterBtnStyle = customStyles.buttons.counter;
const actionBtnStyle = customStyles.buttons.action;
const equipBtnStyle = customStyles.buttons.equip;

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
  const { character, updateField, equipWeapon, equipArmor } = useCharacter();

  const item = aggregated?.item;
  const indices = aggregated?.indices ?? [];
  const quantity = aggregated?.quantity ?? 1;
  const isOnHand = location === 'equipment';
  const moveLabel = isOnHand
    ? t('equipment.moveToStorage')
    : t('equipment.moveToOnHand');

  const [editName, setEditName] = useState(item?.name ?? '');
  const [editDescription, setEditDescription] = useState(item?.description ?? '');
  const [editComments, setEditComments] = useState(item?.comments ?? '');
  const [localQuantity, setLocalQuantity] = useState(quantity);

  useEffect(() => {
    if (!open || !item) return;

    setEditName(item.name ?? '');
    setEditDescription(item.description ?? '');
    setEditComments(item.comments ?? '');
    setLocalQuantity(quantity);
  }, [open, item, quantity]);

  if (!aggregated || !item) return null;

  const tags = item.tags ?? [];
  const isArmor = tags.includes('armor');
  const isWeaponOrShield = tags.includes('weapon') || tags.includes('shield');
  const quantityCacheKey = `${location}:${item.key ?? item.name ?? 'item'}:${indices[0] ?? 0}`;

  const handleSave = () => {
    // Strip amount so new slots get amount: 1 (especially important for ammo items
    // where the existing amount on the item would otherwise be spread onto new slots)
    const { amount: _amount, ...itemWithoutAmount } = item;
    const updatedItem: EquipmentItem = {
      ...itemWithoutAmount,
      name: editName,
      description: editDescription,
      comments: editComments,
    };

    if (localQuantity !== quantity) {
      onAdjustQuantity(updatedItem, localQuantity, indices);
    }

    const retainedCount = Math.min(indices.length, localQuantity);
    const retainedIndices = indices.slice(0, retainedCount);

    if (retainedIndices.length > 0) {
      onUpdate(retainedIndices, updatedItem);
    }

    onClose();
  };

  const handleSell = () => {
    const itemValue = 10;
    if (character) {
      updateField('silver', (character.silver || 0) + itemValue * quantity);
    }
    onDelete(indices);
    onClose();
  };

  return (
    <MorkBorgModal
      open={open}
      onClose={onClose}
      title={editName || t('equipment.itemDetails')}
      maxWidth="sm"
      actions={
        <>
          <Button onClick={onClose}>{t('actions.cancel')}</Button>
          <Button onClick={handleSave} variant="contained">
            {t('equipment.save')}
          </Button>
        </>
      }
    >
      <Box sx={customStyles.inventorySection.modalContent}>
        <TextField
          fullWidth
          label={t('equipment.itemName')}
          value={editName}
          onChange={(event) => setEditName(event.target.value)}
          sx={modalInputStyles}
        />

        <Box>
          <Typography sx={customStyles.inventorySection.quantityLabel}>
            {t('equipment.quantity')}
          </Typography>
          <Box sx={customStyles.inventorySection.quantityControls}>
            <Button
              onClick={() => setLocalQuantity(Math.max(1, localQuantity - 1))}
              sx={counterBtnStyle}
            >
              -
            </Button>
            <Typography sx={customStyles.inventorySection.quantityNumber}>
              <AnimatedNumber
                value={localQuantity}
                cacheKey={`${quantityCacheKey}:modal`}
                durationMs={220}
              />
            </Typography>
            <Button
              onClick={() => setLocalQuantity(localQuantity + 1)}
              sx={counterBtnStyle}
            >
              +
            </Button>
          </Box>
        </Box>

        <TextField
          fullWidth
          multiline
          rows={2}
          label={t('character.description')}
          value={editDescription}
          onChange={(event) => setEditDescription(event.target.value)}
          sx={modalInputStyles}
        />
        <TextField
          fullWidth
          multiline
          rows={2}
          label="Comments / Notes"
          value={editComments}
          onChange={(event) => setEditComments(event.target.value)}
          sx={modalInputStyles}
        />

        {isOnHand && (isArmor || isWeaponOrShield) && (
          <Box sx={customStyles.inventorySection.equipButtons}>
            {isArmor && (
              <Button
                onClick={() => {
                  equipArmor(indices[0]);
                  onClose();
                }}
                sx={equipBtnStyle}
                fullWidth
              >
                EQUIP ARMOR
              </Button>
            )}
            {isWeaponOrShield && (
              <>
                <Button
                  onClick={() => {
                    equipWeapon(indices[0], 0);
                    onClose();
                  }}
                  sx={equipBtnStyle}
                  fullWidth
                >
                  EQUIP SLOT 1
                </Button>
                <Button
                  onClick={() => {
                    equipWeapon(indices[0], 1);
                    onClose();
                  }}
                  sx={equipBtnStyle}
                  fullWidth
                >
                  EQUIP SLOT 2
                </Button>
              </>
            )}
          </Box>
        )}

        <Box sx={customStyles.inventorySection.actionButtons}>
          <Button
            onClick={() => {
              onMove(indices);
              onClose();
            }}
            sx={actionBtnStyle}
          >
            {moveLabel}
          </Button>
          <Button onClick={handleSell} sx={actionBtnStyle}>
            {t('equipment.sell', { amount: 10 * localQuantity })}
          </Button>
          <Button
            onClick={() => {
              onDelete(indices);
              onClose();
            }}
            sx={{
              ...actionBtnStyle,
              ...customStyles.inventorySection.dropButton,
            }}
          >
            {t('equipment.drop')}
          </Button>
        </Box>
      </Box>
    </MorkBorgModal>
  );
}
