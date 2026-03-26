import { useCharacter } from '@/CharacterContext/CharacterContext.tsx';
import { aggregateItems } from '@/utils/aggregateItems';
import {
  Box,
  Divider,
  Menu,
  MenuItem,
  Typography,
  useMediaQuery,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
  forwardRef,
  KeyboardEvent,
  MouseEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { customStyles } from '../theme/morkBorgTheme';
import { StyledEquipmentCard } from './EquippedBar.styled';

interface EquippedQuickProps {
  icon: string;
  type: string;
  name: string;
  detail?: string;
  noneName: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  dataTestId?: string;
  actionLabel?: string;
}

const EquippedQuick = forwardRef<HTMLDivElement, EquippedQuickProps>(
  function EquippedQuick(
    { icon, type, name, detail, noneName, onClick, dataTestId, actionLabel },
    ref
  ) {
    const hasClick = !!onClick;
    const resolvedActionLabel = actionLabel ?? 'Change';
    const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
      if (!onClick) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onClick(event as unknown as MouseEvent<HTMLElement>);
      }
    };

    return (
      <StyledEquipmentCard
        ref={ref}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        hasClick={hasClick}
        data-testid={dataTestId}
        role={hasClick ? 'button' : undefined}
        tabIndex={hasClick ? 0 : undefined}
        aria-haspopup={hasClick ? 'menu' : undefined}
      >
        <Typography sx={customStyles.equippedBar.icon}>{icon}</Typography>
        <Box sx={customStyles.equippedBar.contentBox}>
          <Typography
            variant="subtitle2"
            color="secondary"
            sx={customStyles.equippedBar.typeLabel}
          >
            {type}
          </Typography>
          <Typography
            variant="h4"
            noWrap
            sx={customStyles.equippedBar.itemName}
          >
            {name || noneName}
          </Typography>
          {detail && (
            <Typography
              variant="subtitle2"
              sx={customStyles.equippedBar.itemDetail}
            >
              {detail}
            </Typography>
          )}
        </Box>
        {hasClick && (
          <Box sx={customStyles.equippedBar.action} className="print-hidden">
            <Typography sx={customStyles.equippedBar.actionLabel}>
              {resolvedActionLabel}
            </Typography>
            <ChevronRightIcon sx={customStyles.equippedBar.actionIcon} />
          </Box>
        )}
      </StyledEquipmentCard>
    );
  }
);

function formatDice(dice?: number[]): string {
  if (!dice || dice.length === 0) return '';
  const counts: Record<number, number> = {};
  dice.forEach((d) => {
    counts[d] = (counts[d] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([die, count]) => (count > 1 ? `${count}d${die}` : `d${die}`))
    .join(' + ');
}

export default function EquippedBar() {
  // These methods come from your updated useCurrentCharacter / useCharacterEditor hooks
  const { character, equipWeapon, unequipWeapon, equipArmor, unequipArmor } =
    useCharacter();

  const { t } = useTranslation();
  const prefersReducedMotion = useMediaQuery(
    '(prefers-reduced-motion: reduce)'
  );

  const [weaponAnchor, setWeaponAnchor] = useState<null | HTMLElement>(null);
  const [armorAnchor, setArmorAnchor] = useState<null | HTMLElement>(null);
  const [activeWeaponSlot, setActiveWeaponSlot] = useState<number>(0);

  // Refs for slot animation
  const weaponSlotRef = useRef<HTMLDivElement>(null);
  const armorSlotRef = useRef<HTMLDivElement>(null);

  const animateSlot = useCallback(
    (
      ref: React.RefObject<HTMLDivElement | null>,
      type: 'equip' | 'unequip'
    ) => {
      if (prefersReducedMotion || !ref.current) return;
      const el = ref.current;
      el.style.transition = 'none';
      if (type === 'equip') {
        el.style.boxShadow =
          '0 0 20px rgba(255, 62, 181, 0.6), inset 0 0 20px rgba(255, 62, 181, 0.15)';
        el.style.borderColor = '#FF3EB5';
      } else {
        el.style.transform = 'translateX(-4px)';
      }
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transition =
            type === 'equip'
              ? 'box-shadow 0.6s ease-out, border-color 0.6s ease-out'
              : 'transform 0.08s ease-in-out';
          if (type === 'equip') {
            el.style.boxShadow = '';
            el.style.borderColor = '';
          } else {
            el.style.transform = 'translateX(4px)';
            setTimeout(() => {
              el.style.transition = 'transform 0.08s ease-in-out';
              el.style.transform = 'translateX(-2px)';
              setTimeout(() => {
                el.style.transition = 'transform 0.1s ease-out';
                el.style.transform = '';
              }, 80);
            }, 80);
          }
        });
      });
    },
    [prefersReducedMotion]
  );

  // 1. Data Selectors - We map inventory to include original index for the hooks
  const inventory = character?.equipment || [];

  const groupedInventory = useMemo(
    () => aggregateItems(inventory),
    [inventory]
  );

  const inventoryWeapons = useMemo(
    () =>
      groupedInventory
        .filter((entry) => entry.item.tags?.includes('weapon'))
        .map((entry) => ({
          item: entry.item,
          index: entry.indices[0],
          quantity: entry.quantity,
        })),
    [groupedInventory]
  );

  const inventoryArmor = useMemo(
    () =>
      groupedInventory
        .filter((entry) => entry.item.tags?.includes('armor'))
        .map((entry) => ({
          item: entry.item,
          index: entry.indices[0],
          quantity: entry.quantity,
        })),
    [groupedInventory]
  );

  const equippedWeapons = character?.equippedWeapons || [null, null];
  const mainWeapon = equippedWeapons[0];
  const offhandWeapon = equippedWeapons[1];
  const equippedArmor = character?.equippedArmor;
  const canOpenWeaponSlot0 = inventoryWeapons.length > 0 || !!mainWeapon?.key;
  const canOpenWeaponSlot1 =
    inventoryWeapons.length > 0 || !!offhandWeapon?.key;
  const canOpenArmor = inventoryArmor.length > 0 || !!equippedArmor?.key;

  // 2. Simple Handlers calling our new hooks
  const openWeaponMenu = (
    event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>,
    slot: number
  ) => {
    setActiveWeaponSlot(slot);
    setWeaponAnchor(event.currentTarget);
  };

  const handleSelectWeapon = (equipmentIndex: number) => {
    equipWeapon(equipmentIndex, activeWeaponSlot);
    setWeaponAnchor(null);
    animateSlot(weaponSlotRef, 'equip');
  };

  const handleSelectArmor = (equipmentIndex: number) => {
    equipArmor(equipmentIndex);
    setArmorAnchor(null);
    animateSlot(armorSlotRef, 'equip');
  };

  return (
    <Box sx={customStyles.equippedBar.container}>
      {/* Main Weapon Slot */}
      <EquippedQuick
        ref={weaponSlotRef}
        icon="⚔"
        type={t('equipment.weapon')}
        name={mainWeapon?.name ?? t('equipment.unarmed')}
        detail={mainWeapon?.dice ? formatDice(mainWeapon.dice) : 'd2'}
        noneName={t('equipment.none')}
        onClick={canOpenWeaponSlot0 ? (e) => openWeaponMenu(e, 0) : undefined}
        dataTestId="equipped-weapon-slot-0"
        actionLabel={t('equipment.change', 'Change')}
      />

      {/* Off-hand Slot */}
      {offhandWeapon && (
        <EquippedQuick
          icon="⚚"
          type={t('equipment.offHand')}
          name={offhandWeapon?.name ?? t('equipment.none')}
          detail={offhandWeapon?.dice ? formatDice(offhandWeapon.dice) : ''}
          noneName={t('equipment.none')}
          onClick={canOpenWeaponSlot1 ? (e) => openWeaponMenu(e, 1) : undefined}
          dataTestId="equipped-weapon-slot-1"
          actionLabel={t('equipment.change', 'Change')}
        />
      )}

      {/* Armor Slot */}
      <EquippedQuick
        ref={armorSlotRef}
        icon="🛡"
        type={t('equipment.armorLabel')}
        name={equippedArmor?.name ?? t('equipment.unarmored')}
        detail={
          equippedArmor?.dice ? `-${formatDice(equippedArmor.dice)}` : '−'
        }
        noneName={t('equipment.none')}
        onClick={
          canOpenArmor ? (e) => setArmorAnchor(e.currentTarget) : undefined
        }
        dataTestId="equipped-armor-slot"
        actionLabel={t('equipment.change', 'Change')}
      />

      {/* Weapon Selection Menu */}
      <Menu
        anchorEl={weaponAnchor}
        open={Boolean(weaponAnchor)}
        onClose={() => setWeaponAnchor(null)}
        PaperProps={{ sx: menuPaperStyle }}
      >
        {/* Unequip Option */}
        {equippedWeapons[activeWeaponSlot]?.key && (
          <>
            <MenuItem
              onClick={() => {
                unequipWeapon(activeWeaponSlot);
                setWeaponAnchor(null);
                animateSlot(weaponSlotRef, 'unequip');
              }}
              sx={{
                ...menuItemStyle,
                ...customStyles.equippedBar.menuUnequipItem,
              }}
              data-testid="unequip-weapon-option"
            >
              {t('equipment.unequip')} {equippedWeapons[activeWeaponSlot]?.name}
            </MenuItem>
            {inventoryWeapons.length !== 0 && (
              <Divider sx={customStyles.equippedBar.menuDivider} />
            )}
          </>
        )}

        {inventoryWeapons.map(({ item, index, quantity }) => (
          <MenuItem
            key={`${item.key}-${index}`}
            onClick={() => handleSelectWeapon(index)}
            sx={menuItemStyle}
            data-testid={`equip-weapon-option-${index}`}
          >
            <Typography sx={customStyles.equippedBar.menuItemName}>
              {item.name} {quantity > 1 ? `x${quantity}` : ''}
            </Typography>
            <Typography
              variant="caption"
              sx={customStyles.equippedBar.menuItemDescription}
            >
              {item.description}
            </Typography>
          </MenuItem>
        ))}
      </Menu>

      <Menu
        anchorEl={armorAnchor}
        open={Boolean(armorAnchor)}
        onClose={() => setArmorAnchor(null)}
        PaperProps={{ sx: menuPaperStyle }}
      >
        {/* Unequip Option */}
        {equippedArmor?.key && (
          <>
            <MenuItem
              onClick={() => {
                unequipArmor();
                setArmorAnchor(null);
                animateSlot(armorSlotRef, 'unequip');
              }}
              sx={{
                ...menuItemStyle,
                ...customStyles.equippedBar.menuUnequipItem,
              }}
              data-testid="unequip-armor-option"
            >
              {t('equipment.unequip')} {equippedArmor.name}
            </MenuItem>
            {inventoryArmor.length !== 0 && (
              <Divider sx={customStyles.equippedBar.menuDivider} />
            )}
          </>
        )}

        {inventoryArmor.map(({ item, index, quantity }) => (
          <MenuItem
            key={`${item.key}-${index}`}
            onClick={() => handleSelectArmor(index)}
            sx={menuItemStyle}
            data-testid={`equip-armor-option-${index}`}
          >
            <Typography sx={customStyles.equippedBar.menuItemName}>
              {item.name} {quantity > 1 ? `x${quantity}` : ''}
            </Typography>
            <Typography
              variant="caption"
              sx={customStyles.equippedBar.menuItemDescription}
            >
              {item.description}
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}

// Reusable Menu Styles
const menuPaperStyle = customStyles.menu.paper;
const menuItemStyle = customStyles.menu.item;
