import { useCallback, useEffect, useMemo, useState } from 'react';
import { useCharacter } from '@/CharacterContext/CharacterContext.tsx';
import { ItemSearchHit } from '@/hooks/useEquipmentSearch.ts';
import { aggregateItems, type AggregatedItem } from '@/utils/aggregateItems';
import AnimatedNumber from '@components/AnimatedNumber.tsx';
import ItemAutocomplete from '@components/ItemAutocomplete.tsx';
import { Box, Button, Grow, Paper, TextField, Typography } from '@mui/material';
import { customStyles, morkBorgColors } from '../theme/morkBorgTheme';
import { useTranslation } from 'react-i18next';
import MorkBorgModal from './MorkBorgModal';

// --- Types ---

type EquipmentItem = {
  name?: string;
  description?: string;
  key?: string;
  uses?: boolean[];
  comments?: string;
  tags?: string[];
};

type InventoryLocation = 'equipment' | 'storage';

interface ItemSlotProps {
  aggregated: AggregatedItem<EquipmentItem>;
  location: InventoryLocation;
  onOpenEditor: (aggregated: AggregatedItem<EquipmentItem>) => void;
}

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
    currentIndices: number[]
  ) => void;
}

function buildAggregateKey(aggregated: AggregatedItem<EquipmentItem>): string {
  const namePart = (aggregated.item.name ?? 'item').toLowerCase();
  const firstIndex = aggregated.indices[0] ?? 0;
  return `${namePart}-${firstIndex}`;
}

// --- Components ---

function OpenItemSlot({ aggregated, location, onOpenEditor }: ItemSlotProps) {
  const { item, indices, quantity } = aggregated;
  const quantityCacheKey = `${location}:${item.key ?? item.name ?? 'item'}:${indices[0] ?? 0}`;

  return (
    <Box
      onClick={() => onOpenEditor(aggregated)}
      sx={customStyles.inventorySection.openItemSlot}
    >
      <Grow
        in={quantity > 1}
        mountOnEnter
        unmountOnExit
        timeout={{ enter: 180, exit: 120 }}
      >
        <Box sx={quantityBadgeStyle}>
          <AnimatedNumber
            value={quantity}
            cacheKey={`${quantityCacheKey}:slot`}
            durationMs={220}
          />
          x
        </Box>
      </Grow>

      <Box sx={customStyles.inventorySection.itemContent}>
        <Typography variant="h6" sx={customStyles.inventorySection.openItemName}>
          {item.name}
        </Typography>
        {item.description && (
          <Typography
            variant="body2"
            sx={customStyles.inventorySection.openItemDescription}
          >
            {item.description}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function LoadingItemSlot({ name }: { name: string }) {
  return (
    <Box
      className="item-loading-ghost"
      sx={{
        ...customStyles.inventorySection.openItemSlot,
        cursor: 'default',
        borderLeftColor: morkBorgColors.yellow,
        position: 'relative',
        overflow: 'hidden',
        animation: 'itemGlitchFlicker 1.2s ease-in-out infinite',
        '&:hover': {
          bgcolor: 'transparent',
          transform: 'none',
          borderLeftColor: morkBorgColors.yellow,
        },
      }}
    >
      {/* Scan line */}
      <Box
        className="scan-line"
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${morkBorgColors.pink}, ${morkBorgColors.yellow}, ${morkBorgColors.pink}, transparent)`,
          animation: 'itemScanLine 0.8s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      <Box sx={customStyles.inventorySection.itemContent}>
        <Typography
          variant="h6"
          sx={{
            ...customStyles.inventorySection.openItemName,
            color: morkBorgColors.yellow,
          }}
        >
          {name}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            ...customStyles.inventorySection.openItemDescription,
            opacity: 0.4,
          }}
        >
          &#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;
        </Typography>
      </Box>
    </Box>
  );
}

function ItemSlot({ aggregated, location, onOpenEditor }: ItemSlotProps) {
  const { item, indices, quantity } = aggregated;
  const quantityCacheKey = `${location}:${item.key ?? item.name ?? 'item'}:${indices[0] ?? 0}`;

  return (
    <Box
      onClick={() => onOpenEditor(aggregated)}
      sx={customStyles.inventorySection.itemSlot}
    >
      <Grow
        in={quantity > 1}
        mountOnEnter
        unmountOnExit
        timeout={{ enter: 180, exit: 120 }}
      >
        <Box sx={quantityBadgeStyle}>
          <AnimatedNumber
            value={quantity}
            cacheKey={`${quantityCacheKey}:slot`}
            durationMs={220}
          />
          ×
        </Box>
      </Grow>

      <Box sx={customStyles.inventorySection.itemContent}>
        <Typography variant="h6" sx={customStyles.inventorySection.itemName}>
          {item.name}
        </Typography>
        {item.description && (
          <Typography
            variant="body2"
            sx={customStyles.inventorySection.itemDescription}
          >
            {item.description}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function InventoryItemEditorModal({
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
  const [editDescription, setEditDescription] = useState(
    item?.description ?? ''
  );
  const [editComments, setEditComments] = useState(item?.comments ?? '');
  const [localQuantity, setLocalQuantity] = useState(quantity);

  useEffect(() => {
    if (!open || !item) return;

    setEditName(item.name ?? '');
    setEditDescription(item.description ?? '');
    setEditComments(item.comments ?? '');
    setLocalQuantity(quantity);
  }, [open, item, quantity]);

  if (!aggregated || !item) {
    return null;
  }

  const tags = item.tags ?? [];
  const isArmor = tags.includes('armor');
  const isWeaponOrShield = tags.includes('weapon') || tags.includes('shield');
  const quantityCacheKey = `${location}:${item.key ?? item.name ?? 'item'}:${indices[0] ?? 0}`;

  const handleSave = () => {
    const updatedItem: EquipmentItem = {
      ...item,
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
          onChange={(e) => setEditName(e.target.value)}
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
              −
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
          onChange={(e) => setEditDescription(e.target.value)}
          sx={modalInputStyles}
        />
        <TextField
          fullWidth
          multiline
          rows={2}
          label="Comments / Notes"
          value={editComments}
          onChange={(e) => setEditComments(e.target.value)}
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

export function OnHandSection({ showTitle = true }: { showTitle?: boolean } = {}) {
  const { t } = useTranslation();
  const {
    character,
    updateEquipmentItem,
    removeEquipmentItem,
    moveToStorage,
    addEquipmentItem,
  } = useCharacter();

  const equipment = character?.equipment ?? [];
  const aggregated = useMemo(() => aggregateItems(equipment), [equipment]);
  const [editingGroup, setEditingGroup] =
    useState<AggregatedItem<EquipmentItem> | null>(null);
  const [loadingItems, setLoadingItems] = useState<ItemSearchHit[]>([]);

  const handleAdjustQuantity = (
    item: EquipmentItem,
    newTotal: number,
    currentIndices: number[]
  ) => {
    const diff = newTotal - currentIndices.length;
    if (diff > 0) {
      for (let i = 0; i < diff; i++) addEquipmentItem({ ...item });
    } else if (diff < 0) {
      [...currentIndices]
        .slice(newTotal)
        .reverse()
        .forEach((idx) => removeEquipmentItem(idx));
    }
  };

  const handleAddItem = useCallback(async (hit: ItemSearchHit) => {
    const loadingKey = `${hit.itemType}-${hit.id}`;
    setLoadingItems((prev) => [...prev, hit]);

    try {
      const baseUrl = import.meta.env.VITE_BACKEND_URL ?? '';
      const itemUrl = new URL(`${baseUrl}/equipment/${hit.itemType}/${hit.id}`);
      if (hit.key) {
        itemUrl.searchParams.set('key', hit.key);
      }

      const response = await fetch(itemUrl.toString());
      if (!response.ok) return;
      const fullItem = await response.json();

      const isPet =
        hit.itemType === 'pet' ||
        (Array.isArray(fullItem.tags) && fullItem.tags.includes('pet'));

      const actionDice = (Array.isArray(fullItem.action_die) ? fullItem.action_die : [])
        .map((value: unknown) => Number(value))
        .filter((value: number) => Number.isFinite(value) && value > 0);

      const petHp = Number(fullItem.hp);
      const initialUses =
        isPet && Number.isFinite(petHp) && petHp > 0
          ? Array.from({ length: petHp }, () => true)
          : [];

      addEquipmentItem({
        ...fullItem,
        name: fullItem.name ?? hit.name,
        dice: actionDice.length > 0 ? actionDice : fullItem.dice,
        uses: initialUses,
      });
    } finally {
      setLoadingItems((prev) =>
        prev.filter((h) => `${h.itemType}-${h.id}` !== loadingKey)
      );
    }
  }, [addEquipmentItem]);

  return (
    <Box sx={customStyles.inventorySection.openContainer}>
      {showTitle && (
        <Typography variant="h3" sx={customStyles.inventorySection.sectionTitle}>
          {t('equipment.onHand')}
        </Typography>
      )}
      <Box sx={customStyles.inventorySection.itemsGrid}>
        {aggregated.map((group) => (
          <OpenItemSlot
            key={buildAggregateKey(group)}
            aggregated={group}
            location="equipment"
            onOpenEditor={setEditingGroup}
          />
        ))}
        {loadingItems.map((hit) => (
          <LoadingItemSlot
            key={`loading-${hit.itemType}-${hit.id}`}
            name={hit.name}
          />
        ))}
      </Box>

      <InventoryItemEditorModal
        open={Boolean(editingGroup)}
        aggregated={editingGroup}
        location="equipment"
        onClose={() => setEditingGroup(null)}
        onUpdate={(indices, updated) =>
          indices.forEach((idx) => updateEquipmentItem(idx, updated))
        }
        onDelete={(indices) =>
          [...indices].reverse().forEach((idx) => removeEquipmentItem(idx))
        }
        onMove={(indices) =>
          [...indices].reverse().forEach((idx) => moveToStorage(idx))
        }
        onAdjustQuantity={handleAdjustQuantity}
      />

      <Box sx={customStyles.inventorySection.openAddItem} className="print-hidden">
        <ItemAutocomplete
          onSelect={handleAddItem}
          placeholder={t('equipment.searchPlaceholder')}
        />
      </Box>
    </Box>
  );
}

export function StorageSection({ showTitle = true }: { showTitle?: boolean } = {}) {
  const { t } = useTranslation();
  const {
    character,
    updateStorageItem,
    removeStorageItem,
    moveToEquipment,
    addStorageItem,
  } = useCharacter();

  const storage = character?.storage ?? [];
  const aggregated = useMemo(() => aggregateItems(storage), [storage]);
  const [editingGroup, setEditingGroup] =
    useState<AggregatedItem<EquipmentItem> | null>(null);

  if (aggregated.length === 0) {
    return null;
  }

  const handleAdjustQuantity = (
    item: EquipmentItem,
    newTotal: number,
    currentIndices: number[]
  ) => {
    const diff = newTotal - currentIndices.length;
    if (diff > 0) {
      for (let i = 0; i < diff; i++) addStorageItem({ ...item });
    } else if (diff < 0) {
      [...currentIndices]
        .slice(newTotal)
        .reverse()
        .forEach((idx) => removeStorageItem(idx));
    }
  };

  return (
    <Paper sx={sectionPaperStyle}>
      {showTitle && (
        <Typography variant="h3" sx={customStyles.inventorySection.sectionTitle}>
          {t('equipment.storedItems')}
        </Typography>
      )}
      <Box sx={customStyles.inventorySection.itemsGrid}>
        {aggregated.map((group) => (
          <Paper key={buildAggregateKey(group)} sx={itemRowStyle}>
            <ItemSlot
              aggregated={group}
              location="storage"
              onOpenEditor={setEditingGroup}
            />
          </Paper>
        ))}
      </Box>

      <InventoryItemEditorModal
        open={Boolean(editingGroup)}
        aggregated={editingGroup}
        location="storage"
        onClose={() => setEditingGroup(null)}
        onUpdate={(indices, updated) =>
          indices.forEach((idx) => updateStorageItem(idx, updated))
        }
        onDelete={(indices) =>
          [...indices].reverse().forEach((idx) => removeStorageItem(idx))
        }
        onMove={(indices) =>
          [...indices].reverse().forEach((idx) => moveToEquipment(idx))
        }
        onAdjustQuantity={handleAdjustQuantity}
      />
    </Paper>
  );
}

export const BackpackSection = StorageSection;

// --- Styles ---

const sectionPaperStyle = customStyles.paper.section;
const itemRowStyle = customStyles.paper.itemRow;

const quantityBadgeStyle = customStyles.quantityBadge;

const modalInputStyles = customStyles.modal.input;

const counterBtnStyle = customStyles.buttons.counter;
const actionBtnStyle = customStyles.buttons.action;
const equipBtnStyle = customStyles.buttons.equip;
