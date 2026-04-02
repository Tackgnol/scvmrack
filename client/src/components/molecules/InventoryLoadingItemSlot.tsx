import { Box, Typography } from '@mui/material';
import { customStyles, morkBorgColors } from '@/theme/morkBorgTheme';

interface InventoryLoadingItemSlotProps {
  name: string;
}

export default function InventoryLoadingItemSlot({
  name,
}: InventoryLoadingItemSlotProps) {
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
      <Box
        className="scan-line"
        data-testid="scan-line"
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
