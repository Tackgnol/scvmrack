import { Divider, Menu, MenuItem } from '@mui/material';
import { customStyles } from '@/theme/morkBorgTheme';
import EquipmentMenuListItem from './EquipmentMenuListItem';
import { type EquipmentMenuOption } from '@components/equipped/types';

interface EquipmentSelectionMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  options: EquipmentMenuOption[];
  onSelect: (index: number) => void;
  selectDataTestIdPrefix: string;
  equippedName?: string;
  onUnequip?: () => void;
  unequipDataTestId?: string;
  unequipLabel?: string;
  resolveAmmo?: (ammoType: string) => number | null;
}

const menuPaperStyle = customStyles.menu.paper;
const menuItemStyle = customStyles.menu.item;

export default function EquipmentSelectionMenu({
  anchorEl,
  onClose,
  options,
  onSelect,
  selectDataTestIdPrefix,
  equippedName,
  onUnequip,
  unequipDataTestId,
  unequipLabel,
  resolveAmmo,
}: EquipmentSelectionMenuProps) {
  const hasEquipped = Boolean(equippedName && onUnequip);

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      PaperProps={{ sx: menuPaperStyle }}
    >
      {hasEquipped && (

          <MenuItem
            onClick={onUnequip}
            sx={{
              ...menuItemStyle,
              ...customStyles.equippedBar.menuUnequipItem,
            }}
            data-testid={unequipDataTestId}
          >
            {unequipLabel} {equippedName}
            {options.length !== 0 && (
                <Divider sx={customStyles.equippedBar.menuDivider}/>
            )}
          </MenuItem>

      )}

      {options.map(({ item, index, quantity }) => (
        <EquipmentMenuListItem
          key={`${item.key}-${index}`}
          name={item.name}
          description={item.description}
          quantity={quantity}
          ammoCount={item.ammoType && resolveAmmo ? resolveAmmo(item.ammoType) ?? undefined : undefined}
          onClick={() => onSelect(index)}
          dataTestId={`${selectDataTestIdPrefix}${index}`}
        />
      ))}
    </Menu>
  );
}
