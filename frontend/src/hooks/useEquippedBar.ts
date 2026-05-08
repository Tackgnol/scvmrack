import { useCharacter } from '@/CharacterContext/CharacterContext';
import { type EquipmentItem } from '@/hooks/models';
import { aggregateItems } from '@/utils/aggregateItems';
import { useMediaQuery } from '@mui/material';
import {
  type KeyboardEvent,
  type MouseEvent,
  type RefObject,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { type EquipmentMenuOption } from '@components/equipped/types';
import { useAmmoForWeapon } from '@/hooks/useAmmoForWeapon';

const EMPTY_EQUIPPED_WEAPONS: [EquipmentItem | null, EquipmentItem | null] = [
  null,
  null,
];

export function useEquippedBar() {
  const { character, equipWeapon, unequipWeapon, equipArmor, unequipArmor, useAmmo } =
    useCharacter();
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const [weaponAnchor, setWeaponAnchor] = useState<null | HTMLElement>(null);
  const [armorAnchor, setArmorAnchor] = useState<null | HTMLElement>(null);
  const [activeWeaponSlot, setActiveWeaponSlot] = useState<number>(0);

  const weaponSlotRef = useRef<HTMLDivElement>(null);
  const armorSlotRef = useRef<HTMLDivElement>(null);

  const animateSlot = useCallback(
    (ref: RefObject<HTMLDivElement | null>, type: 'equip' | 'unequip') => {
      if (prefersReducedMotion || !ref.current) return;

      const element = ref.current;
      element.style.transition = 'none';

      if (type === 'equip') {
        element.style.boxShadow =
          '0 0 20px rgba(255, 62, 181, 0.6), inset 0 0 20px rgba(255, 62, 181, 0.15)';
        element.style.borderColor = '#FF3EB5';
      } else {
        element.style.transform = 'translateX(-4px)';
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          element.style.transition =
            type === 'equip'
              ? 'box-shadow 0.6s ease-out, border-color 0.6s ease-out'
              : 'transform 0.08s ease-in-out';
          if (type === 'equip') {
            element.style.boxShadow = '';
            element.style.borderColor = '';
          } else {
            element.style.transform = 'translateX(4px)';
            setTimeout(() => {
              element.style.transition = 'transform 0.08s ease-in-out';
              element.style.transform = 'translateX(-2px)';
              setTimeout(() => {
                element.style.transition = 'transform 0.1s ease-out';
                element.style.transform = '';
              }, 80);
            }, 80);
          }
        });
      });
    },
    [prefersReducedMotion],
  );

  const inventory = character?.equipment ?? [];
  const groupedInventory = useMemo(() => aggregateItems(inventory), [inventory]);

  const resolveAmmo = useCallback(
    (ammoType: string): number | null => {
      let total = 0;
      for (const item of inventory) {
        if (item.ammoType === ammoType && item.tags?.includes('ammo')) {
          const amt = item.amount;
          total += typeof amt === 'number' && Number.isFinite(amt) && amt > 0 ? amt : 1;
        }
      }
      return total;
    },
    [inventory],
  );

  const inventoryWeapons = useMemo<EquipmentMenuOption[]>(
    () =>
      groupedInventory
        .filter((entry) => entry.item.tags?.includes('weapon'))
        .map((entry) => ({
          item: entry.item,
          index: entry.indices[0],
          quantity: entry.quantity,
        })),
    [groupedInventory],
  );

  const inventoryArmor = useMemo<EquipmentMenuOption[]>(
    () =>
      groupedInventory
        .filter((entry) => entry.item.tags?.includes('armor'))
        .map((entry) => ({
          item: entry.item,
          index: entry.indices[0],
          quantity: entry.quantity,
        })),
    [groupedInventory],
  );

  const equippedWeapons = (character?.equippedWeapons as
    | [EquipmentItem | null, EquipmentItem | null]
    | undefined) ?? EMPTY_EQUIPPED_WEAPONS;
  const mainWeapon = equippedWeapons[0];
  const offhandWeapon = equippedWeapons[1];
  const equippedArmor = character?.equippedArmor ?? null;

  const mainWeaponAmmo = useAmmoForWeapon(mainWeapon);
  const offhandWeaponAmmo = useAmmoForWeapon(offhandWeapon);

  const useMainWeaponAmmo = useCallback(() => {
    if (mainWeaponAmmo.equipmentIndex !== null && mainWeaponAmmo.ammoCount !== null && mainWeaponAmmo.ammoCount > 0) {
      useAmmo(mainWeaponAmmo.equipmentIndex);
    }
  }, [mainWeaponAmmo.equipmentIndex, mainWeaponAmmo.ammoCount, useAmmo]);

  const useOffhandWeaponAmmo = useCallback(() => {
    if (offhandWeaponAmmo.equipmentIndex !== null && offhandWeaponAmmo.ammoCount !== null && offhandWeaponAmmo.ammoCount > 0) {
      useAmmo(offhandWeaponAmmo.equipmentIndex);
    }
  }, [offhandWeaponAmmo.equipmentIndex, offhandWeaponAmmo.ammoCount, useAmmo]);

  const canOpenWeaponSlot0 = inventoryWeapons.length > 0 || Boolean(mainWeapon?.key);
  const canOpenWeaponSlot1 =
    inventoryWeapons.length > 0 || Boolean(offhandWeapon?.key);
  const canOpenArmor = inventoryArmor.length > 0 || Boolean(equippedArmor?.key);

  const openWeaponMenu = (
    event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>,
    slot: number,
  ) => {
    setActiveWeaponSlot(slot);
    setWeaponAnchor(event.currentTarget);
  };

  const closeWeaponMenu = () => setWeaponAnchor(null);
  const closeArmorMenu = () => setArmorAnchor(null);

  const selectWeapon = (equipmentIndex: number) => {
    equipWeapon(equipmentIndex, activeWeaponSlot);
    closeWeaponMenu();
    animateSlot(weaponSlotRef, 'equip');
  };

  const selectArmor = (equipmentIndex: number) => {
    equipArmor(equipmentIndex);
    closeArmorMenu();
    animateSlot(armorSlotRef, 'equip');
  };

  const unequipActiveWeapon = () => {
    unequipWeapon(activeWeaponSlot);
    closeWeaponMenu();
    animateSlot(weaponSlotRef, 'unequip');
  };

  const unequipCurrentArmor = () => {
    unequipArmor();
    closeArmorMenu();
    animateSlot(armorSlotRef, 'unequip');
  };

  return {
    weaponAnchor,
    armorAnchor,
    setArmorAnchor,
    activeWeaponSlot,
    weaponSlotRef,
    armorSlotRef,
    mainWeapon,
    offhandWeapon,
    equippedArmor,
    equippedWeapons,
    inventoryWeapons,
    inventoryArmor,
    canOpenWeaponSlot0,
    canOpenWeaponSlot1,
    canOpenArmor,
    openWeaponMenu,
    closeWeaponMenu,
    closeArmorMenu,
    selectWeapon,
    selectArmor,
    unequipActiveWeapon,
    unequipCurrentArmor,
    mainWeaponAmmo,
    offhandWeaponAmmo,
    useMainWeaponAmmo,
    useOffhandWeaponAmmo,
    resolveAmmo,
  };
}
