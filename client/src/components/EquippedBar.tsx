import {useCharacter} from "@/CharacterContext/CharacterContext.tsx";
import {Box, Divider, Menu, MenuItem, Typography} from '@mui/material';
import {MouseEvent, useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import { customStyles} from '../theme/morkBorgTheme';
import { StyledEquipmentCard } from './EquippedBar.styled';

interface EquippedQuickProps {
    icon: string;
    type: string;
    name: string;
    detail?: string;
    noneName: string;
    onClick?: (event: MouseEvent<HTMLElement>) => void;
}

function EquippedQuick({icon, type, name, detail, noneName, onClick}: EquippedQuickProps) {
    return (
        <StyledEquipmentCard onClick={onClick} hasClick={!!onClick}>
            <Typography sx={customStyles.equippedBar.icon}>{icon}</Typography>
            <Box sx={customStyles.equippedBar.contentBox}>
                <Typography variant="subtitle2" color="secondary" sx={customStyles.equippedBar.typeLabel}>
                    {type}
                </Typography>
                <Typography variant="h4" noWrap sx={customStyles.equippedBar.itemName}>
                    {name || noneName}
                </Typography>
                {detail && (
                    <Typography variant="subtitle2" sx={customStyles.equippedBar.itemDetail}>
                        {detail}
                    </Typography>
                )}
            </Box>
        </StyledEquipmentCard>
    );
}

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
    const {
        character,
        equipWeapon,
        unequipWeapon,
        equipArmor,
        unequipArmor
    } = useCharacter();

    const {t} = useTranslation();

    const [weaponAnchor, setWeaponAnchor] = useState<null | HTMLElement>(null);
    const [armorAnchor, setArmorAnchor] = useState<null | HTMLElement>(null);
    const [activeWeaponSlot, setActiveWeaponSlot] = useState<number>(0);

    // 1. Data Selectors - We map inventory to include original index for the hooks
    const inventory = character?.equipment || [];

    const inventoryWeapons = useMemo(() =>
            inventory
                .map((item, index) => ({item, index}))
                .filter(entry => entry.item.tags?.includes('weapon')),
        [inventory]
    );

    const inventoryArmor = useMemo(() =>
            inventory
                .map((item, index) => ({item, index}))
                .filter(entry => entry.item.tags?.includes('armor')),
        [inventory]
    );

    const equippedWeapons = character?.equipped_weapons || [null, null];
    const mainWeapon = equippedWeapons[0];
    const offhandWeapon = equippedWeapons[1];
    const equippedArmor = character?.equipped_armor;

    // 2. Simple Handlers calling our new hooks
    const openWeaponMenu = (event: MouseEvent<HTMLElement>, slot: number) => {
        setActiveWeaponSlot(slot);
        setWeaponAnchor(event.currentTarget);
    };

    const handleSelectWeapon = (equipmentIndex: number) => {
        equipWeapon(equipmentIndex, activeWeaponSlot);
        setWeaponAnchor(null);
    };

    const handleSelectArmor = (equipmentIndex: number) => {
        equipArmor(equipmentIndex);
        setArmorAnchor(null);
    };

    return (
        <Box sx={customStyles.equippedBar.container}>

            {/* Main Weapon Slot */}
            <EquippedQuick
                icon="⚔"
                type={t('equipment.weapon')}
                name={mainWeapon?.name ?? t('equipment.unarmed')}
                detail={mainWeapon?.dice ? formatDice(mainWeapon.dice) : 'd2'}
                noneName={t('equipment.none')}
                onClick={(e) => openWeaponMenu(e, 0)}
            />

            {/* Off-hand Slot */}
            {offhandWeapon && (<EquippedQuick
                icon="⚚"
                type={t('equipment.offHand')}
                name={offhandWeapon?.name ?? t('equipment.none')}
                detail={offhandWeapon?.dice ? formatDice(offhandWeapon.dice) : ''}
                noneName={t('equipment.none')}
                onClick={(e) => openWeaponMenu(e, 1)}
            />)}

            {/* Armor Slot */}
            <EquippedQuick
                icon="🛡"
                type={t('equipment.armorLabel')}
                name={equippedArmor?.name ?? t('equipment.unarmored')}
                detail={equippedArmor?.dice ? `-${formatDice(equippedArmor.dice)}` : '−'}
                noneName={t('equipment.none')}
                onClick={(e) => setArmorAnchor(e.currentTarget)}
            />

            {/* Weapon Selection Menu */}
            <Menu anchorEl={weaponAnchor} open={Boolean(weaponAnchor)} onClose={() => setWeaponAnchor(null)}
                  PaperProps={{sx: menuPaperStyle}}>

                {/* Unequip Option */}
                {equippedWeapons[activeWeaponSlot]?.key && (
                    <MenuItem
                        onClick={() => {
                            unequipWeapon(activeWeaponSlot);
                            setWeaponAnchor(null);
                        }}
                        sx={{...menuItemStyle, ...customStyles.equippedBar.menuUnequipItem}}
                    >
                        {t('equipment.unequip')} {equippedWeapons[activeWeaponSlot]?.name}
                    </MenuItem>
                )}

                {inventoryWeapons.length !== 0 && <Divider sx={customStyles.equippedBar.menuDivider}/>}


                {inventoryWeapons.map(({item, index}) => (
                    <MenuItem key={`${item.key}-${index}`} onClick={() => handleSelectWeapon(index)} sx={menuItemStyle}>
                        <Typography sx={customStyles.equippedBar.menuItemName}>{item.name}</Typography>
                        <Typography variant="caption" sx={customStyles.equippedBar.menuItemDescription}>{item.description}</Typography>
                    </MenuItem>
                ))}
            </Menu>

            <Menu anchorEl={armorAnchor} open={Boolean(armorAnchor)} onClose={() => setArmorAnchor(null)}
                  PaperProps={{sx: menuPaperStyle}}>

                {/* Unequip Option */}
                {equippedArmor?.key && (
                    <MenuItem
                        onClick={() => {
                            unequipArmor();
                            setArmorAnchor(null);
                        }}
                        sx={{...menuItemStyle, ...customStyles.equippedBar.menuUnequipItem}}
                    >
                        {t('equipment.unequip')} {equippedArmor.name}
                    </MenuItem>
                )}

                {inventoryWeapons.length !== 0 && <Divider sx={customStyles.equippedBar.menuDivider}/>}


                {inventoryArmor.map(({item, index}) => (
                    <MenuItem key={`${item.key}-${index}`} onClick={() => handleSelectArmor(index)} sx={menuItemStyle}>
                        <Typography sx={customStyles.equippedBar.menuItemName}>{item.name}</Typography>
                        <Typography variant="caption" sx={customStyles.equippedBar.menuItemDescription}>{item.description}</Typography>
                    </MenuItem>
                ))}
            </Menu>
        </Box>
    );
}

// Reusable Menu Styles
const menuPaperStyle = customStyles.menu.paper;
const menuItemStyle = customStyles.menu.item;
