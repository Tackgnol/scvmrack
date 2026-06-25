import AddIcon from '@mui/icons-material/Add';
import { Box, Button, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { customStyles } from '@/theme/morkBorgTheme';
import {
  ItemAutocomplete,
  InventoryItemSlot,
  InventoryItemEditorModal,
} from '@components/index';
import { buildAggregateKey } from '@components/inventory/buildAggregateKey';
import { useOnHandSection } from '@/hooks/useOnHandSection';
import { useState } from 'react';
import CustomItemModal from './CustomItemModal';

export function OnHandSection({
  showTitle = true,
}: { showTitle?: boolean } = {}) {
  const { t } = useTranslation();
  const [customItemOpen, setCustomItemOpen] = useState(false);
  const {
    character,
    aggregated,
    ammoTypes,
    editingGroup,
    setEditingGroup,
    handleAddItem,
    handleAddCustomItems,
    handleAdjustQuantity,
    handleUpdate,
    handleDelete,
    handleMove,
  } = useOnHandSection();

  return (
    <Box sx={customStyles.inventorySection.openContainer}>
      {showTitle && (
        <Typography
          variant="h3"
          sx={customStyles.inventorySection.sectionTitle}
        >
          {t('equipment.onHand')}
        </Typography>
      )}
      <Box sx={customStyles.inventorySection.itemsGrid}>
        {aggregated.map((group) => (
          <InventoryItemSlot
            key={buildAggregateKey(group)}
            aggregated={group}
            location="equipment"
            variant="open"
            onOpenEditor={setEditingGroup}
          />
        ))}
      </Box>

      <InventoryItemEditorModal
        open={Boolean(editingGroup)}
        aggregated={editingGroup}
        location="equipment"
        onClose={() => setEditingGroup(null)}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onMove={handleMove}
        onAdjustQuantity={handleAdjustQuantity}
      />

      <Box
        sx={customStyles.inventorySection.openAddItem}
        className="print-hidden"
      >
        <Box sx={customStyles.inventorySection.openAddItemRow}>
          <ItemAutocomplete
            onSelect={handleAddItem}
            placeholder={t('equipment.searchPlaceholder')}
          />
          <Button
            startIcon={<AddIcon />}
            onClick={() => setCustomItemOpen(true)}
            sx={{
              ...customStyles.buttons.action,
              ...customStyles.inventorySection.openAddItemButton,
            }}
            aria-label={t(
              'equipment.customItem.buttonAria',
              'Forge a custom item',
            )}
          >
            {t('equipment.customItem.button', 'Forge')}
          </Button>
        </Box>
      </Box>

      <CustomItemModal
        open={customItemOpen}
        character={character}
        ammoTypes={ammoTypes}
        onClose={() => setCustomItemOpen(false)}
        onCreate={handleAddCustomItems}
      />
    </Box>
  );
}
