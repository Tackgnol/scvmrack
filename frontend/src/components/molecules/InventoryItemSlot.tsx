import { Box, ButtonBase, Typography } from '@mui/material';
import { type AggregatedItem } from '@/utils/aggregateItems';
import { customStyles } from '@/theme/morkBorgTheme';
import { ItemQuantityBadge } from '@components/index';

type InventoryLocation = 'equipment' | 'storage';
type InventorySlotVariant = 'open' | 'stored';

type InventoryItemBase = {
  key?: string;
  name?: string;
  description?: string;
};

interface InventoryItemSlotProps<T extends InventoryItemBase> {
  aggregated: AggregatedItem<T>;
  location: InventoryLocation;
  variant: InventorySlotVariant;
  onOpenEditor: (aggregated: AggregatedItem<T>) => void;
}

export default function InventoryItemSlot<T extends InventoryItemBase>({
  aggregated,
  location,
  variant,
  onOpenEditor,
}: InventoryItemSlotProps<T>) {
  const { item, indices, quantity } = aggregated;
  const quantityCacheKey = `${location}:${item.key ?? item.name ?? 'item'}:${indices[0] ?? 0}`;
  const isOpenVariant = variant === 'open';

  return (
    <ButtonBase
      onClick={() => onOpenEditor(aggregated)}
      sx={{
        ...(isOpenVariant
          ? customStyles.inventorySection.openItemSlot
          : customStyles.inventorySection.itemSlot),
        justifyContent: 'flex-start',
        textAlign: 'left',
        width: '100%',
      }}
      data-testid="inventory-item-slot"
      type="button"
    >
      <ItemQuantityBadge
        quantity={quantity}
        cacheKey={`${quantityCacheKey}:slot`}
        symbol={isOpenVariant ? 'x' : '×'}
      />

      <Box sx={customStyles.inventorySection.itemContent}>
        <Typography
          variant="h6"
          sx={
            isOpenVariant
              ? customStyles.inventorySection.openItemName
              : customStyles.inventorySection.itemName
          }
        >
          {item.name}
        </Typography>
        {item.description && (
          <Typography
            variant="body2"
            sx={
              isOpenVariant
                ? customStyles.inventorySection.openItemDescription
                : customStyles.inventorySection.itemDescription
            }
          >
            {item.description}
          </Typography>
        )}
      </Box>
    </ButtonBase>
  );
}
