import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { customStyles } from '@/theme/morkBorgTheme';
import EquippedQuickCard from '@components/molecules/equipped/EquippedQuickCard';
import EquipmentSelectionMenu from '@components/molecules/equipped/EquipmentSelectionMenu';
import { formatDice } from '@components/equipped/formatDice';
import { useEquippedBar } from '@/hooks/useEquippedBar';

export default function EquippedBar() {
  const { t } = useTranslation();
  const {
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
  } = useEquippedBar();

  return (
    <Box sx={customStyles.equippedBar.container}>
      <EquippedQuickCard
        ref={weaponSlotRef}
        icon="⚔"
        type={t('equipment.weapon')}
        name={mainWeapon?.name ?? t('equipment.unarmed')}
        detail={mainWeapon?.dice ? formatDice(mainWeapon.dice) : 'd2'}
        noneName={t('equipment.none')}
        onClick={canOpenWeaponSlot0 ? (event) => openWeaponMenu(event, 0) : undefined}
        dataTestId="equipped-weapon-slot-0"
        actionLabel={t('equipment.change', 'Change')}
        ammoCount={mainWeaponAmmo.ammoCount}
        onAmmoUse={useMainWeaponAmmo}
      />

      {offhandWeapon && (
        <EquippedQuickCard
          icon="⚚"
          type={t('equipment.offHand')}
          name={offhandWeapon.name ?? t('equipment.none')}
          detail={offhandWeapon.dice ? formatDice(offhandWeapon.dice) : ''}
          noneName={t('equipment.none')}
          onClick={canOpenWeaponSlot1 ? (event) => openWeaponMenu(event, 1) : undefined}
          dataTestId="equipped-weapon-slot-1"
          actionLabel={t('equipment.change', 'Change')}
          ammoCount={offhandWeaponAmmo.ammoCount}
          onAmmoUse={useOffhandWeaponAmmo}
        />
      )}

      <EquippedQuickCard
        ref={armorSlotRef}
        icon="🛡"
        type={t('equipment.armorLabel')}
        name={equippedArmor?.name ?? t('equipment.unarmored')}
        detail={equippedArmor?.dice ? `-${formatDice(equippedArmor.dice)}` : '−'}
        noneName={t('equipment.none')}
        onClick={canOpenArmor ? (event) => setArmorAnchor(event.currentTarget) : undefined}
        dataTestId="equipped-armor-slot"
        actionLabel={t('equipment.change', 'Change')}
      />

      <EquipmentSelectionMenu
        anchorEl={weaponAnchor}
        onClose={closeWeaponMenu}
        options={inventoryWeapons}
        onSelect={selectWeapon}
        selectDataTestIdPrefix="equip-weapon-option-"
        equippedName={equippedWeapons[activeWeaponSlot]?.name}
        onUnequip={equippedWeapons[activeWeaponSlot]?.key ? unequipActiveWeapon : undefined}
        unequipDataTestId="unequip-weapon-option"
        unequipLabel={t('equipment.unequip')}
        resolveAmmo={resolveAmmo}
      />

      <EquipmentSelectionMenu
        anchorEl={armorAnchor}
        onClose={closeArmorMenu}
        options={inventoryArmor}
        onSelect={selectArmor}
        selectDataTestIdPrefix="equip-armor-option-"
        equippedName={equippedArmor?.name}
        onUnequip={equippedArmor?.key ? unequipCurrentArmor : undefined}
        unequipDataTestId="unequip-armor-option"
        unequipLabel={t('equipment.unequip')}
      />
    </Box>
  );
}
