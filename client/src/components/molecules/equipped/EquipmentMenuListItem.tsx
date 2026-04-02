import { MenuItem, Typography } from '@mui/material';
import { customStyles, morkBorgColors } from '@/theme/morkBorgTheme';

interface EquipmentMenuListItemProps {
  name?: string;
  description?: string;
  quantity: number;
  ammoCount?: number | null;
  onClick: () => void;
  dataTestId: string;
}

const menuItemStyle = customStyles.menu.item;

export default function EquipmentMenuListItem({
  name,
  description,
  quantity,
  ammoCount,
  onClick,
  dataTestId,
}: EquipmentMenuListItemProps) {
  return (
    <MenuItem onClick={onClick} sx={menuItemStyle} data-testid={dataTestId}>
      <Typography sx={customStyles.equippedBar.menuItemName}>
        {name} {quantity > 1 ? `x${quantity}` : ''}
      </Typography>
      <Typography variant="caption" sx={customStyles.equippedBar.menuItemDescription}>
        {description}
        {ammoCount !== null && ammoCount !== undefined && (
          <Typography
            component="span"
            variant="caption"
            sx={{ color: ammoCount > 0 ? morkBorgColors.yellow : morkBorgColors.pink, ml: 1 }}
          >
            ({ammoCount} ammo)
          </Typography>
        )}
      </Typography>
    </MenuItem>
  );
}
