import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { customStyles } from '@/theme/morkBorgTheme';
import {
  ItemAutocomplete,
  InventoryItemSlot,
  InventoryLoadingItemSlot,
  InventoryItemEditorModal,
} from '@components/index';
import { buildAggregateKey } from '@components/inventory/buildAggregateKey';
import { useOnHandSection } from '@/hooks/useOnHandSection';

export function OnHandSection({ showTitle = true }: { showTitle?: boolean } = {}) {
  const { t } = useTranslation();
  const {
    aggregated,
    loadingItems,
    editingGroup,
    setEditingGroup,
    handleAddItem,
    handleAdjustQuantity,
    handleUpdate,
    handleDelete,
    handleMove,
  } = useOnHandSection();

  return (
    <Box sx={customStyles.inventorySection.openContainer}>
      {showTitle && (
        <Typography variant="h3" sx={customStyles.inventorySection.sectionTitle}>
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
        {loadingItems.map((hit) => (
          <InventoryLoadingItemSlot
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
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onMove={handleMove}
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
