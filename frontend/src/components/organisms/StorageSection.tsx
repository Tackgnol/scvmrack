import { Box, Paper, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { customStyles } from '@/theme/morkBorgTheme';
import {
  InventoryItemSlot,
  InventoryItemEditorModal,
} from '@components/index';
import { buildAggregateKey } from '@components/inventory/buildAggregateKey';
import { useStorageSection } from '@/hooks/useStorageSection';

export function StorageSection({ showTitle = true }: { showTitle?: boolean } = {}) {
  const { t } = useTranslation();
  const {
    aggregated,
    editingGroup,
    setEditingGroup,
    handleAdjustQuantity,
    handleUpdate,
    handleDelete,
    handleMove,
  } = useStorageSection();

  if (aggregated.length === 0) {
    return null;
  }

  return (
    <Paper sx={customStyles.paper.section}>
      {showTitle && (
        <Typography variant="h3" sx={customStyles.inventorySection.sectionTitle}>
          {t('equipment.storedItems')}
        </Typography>
      )}
      <Box sx={customStyles.inventorySection.itemsGrid}>
        {aggregated.map((group) => (
          <Paper key={buildAggregateKey(group)} sx={customStyles.paper.itemRow}>
            <InventoryItemSlot
              aggregated={group}
              location="storage"
              variant="stored"
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
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onMove={handleMove}
        onAdjustQuantity={handleAdjustQuantity}
      />
    </Paper>
  );
}

export const BackpackSection = StorageSection;
