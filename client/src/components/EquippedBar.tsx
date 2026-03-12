import {useCharacter} from "@/CharacterContext/CharacterContext.tsx";
import { aggregateItems } from "@/utils/aggregateItems";
import {Box, Divider, Menu, MenuItem, Typography} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {KeyboardEvent, MouseEvent, useMemo, useState} from 'react';
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
    dataTestId?: string;
    actionLabel?: string;
}

function EquippedQuick({icon, type, name, detail, noneName, onClick, dataTestId, actionLabel}: EquippedQuickProps) {
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
            {hasClick && (
                <Box sx={customStyles.equippedBar.action}>
                    <Typography sx={customStyles.equippedBar.actionLabel}>
                        {resolvedActionLabel}
                    </Typography>
                    <ChevronRightIcon sx={customStyles.equippedBar.actionIcon} />
                </Box>
            )}
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

    const groupedInventory = useMemo(() => aggregateItems(inventory), [inventory]);

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

    const equippedWeapons = character?.equipped_weapons || [null, null];
    const mainWeapon = equippedWeapons[0];
    const offhandWeapon = equippedWeapons[1];
    const equippedArmor = character?.equipped_armor;

    // 2. Simple Handlers calling our new hooks
    const openWeaponMenu = (event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>, slot: number) => {
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
                dataTestId="equipped-weapon-slot-0"
                actionLabel={t('equipment.change', 'Change')}
            />

            {/* Off-hand Slot */}
            {offhandWeapon && (<EquippedQuick
                icon="⚚"
                type={t('equipment.offHand')}
                name={offhandWeapon?.name ?? t('equipment.none')}
                detail={offhandWeapon?.dice ? formatDice(offhandWeapon.dice) : ''}
                noneName={t('equipment.none')}
                onClick={(e) => openWeaponMenu(e, 1)}
                dataTestId="equipped-weapon-slot-1"
                actionLabel={t('equipment.change', 'Change')}
            />)}

            {/* Armor Slot */}
            <EquippedQuick
                icon="🛡"
                type={t('equipment.armorLabel')}
                name={equippedArmor?.name ?? t('equipment.unarmored')}
                detail={equippedArmor?.dice ? `-${formatDice(equippedArmor.dice)}` : '−'}
                noneName={t('equipment.none')}
                onClick={(e) => setArmorAnchor(e.currentTarget)}
                dataTestId="equipped-armor-slot"
                actionLabel={t('equipment.change', 'Change')}
            />

            {/* Weapon Selection Menu */}
            <Menu anchorEl={weaponAnchor} open={Boolean(weaponAnchor)} onClose={() => setWeaponAnchor(null)}
                  PaperProps={{sx: menuPaperStyle}}>

                {/* Unequip Option */}
                {equippedWeapons[activeWeaponSlot]?.key && (
                    <>
                    <MenuItem
                        onClick={() => {
                            unequipWeapon(activeWeaponSlot);
                            setWeaponAnchor(null);
                        }}
                        sx={{...menuItemStyle, ...customStyles.equippedBar.menuUnequipItem}}
                        data-testid="unequip-weapon-option"
                    >
                        {t('equipment.unequip')} {equippedWeapons[activeWeaponSlot]?.name}
                    </MenuItem>
                    {inventoryWeapons.length !== 0 && <Divider sx={customStyles.equippedBar.menuDivider}/>}
                    </>
                )}


                {inventoryWeapons.map(({item, index, quantity}) => (
                    <MenuItem key={`${item.key}-${index}`} onClick={() => handleSelectWeapon(index)} sx={menuItemStyle} data-testid={`equip-weapon-option-${index}`}>
                        <Typography sx={customStyles.equippedBar.menuItemName}>
                            {item.name} {quantity > 1 ? `x${quantity}` : ''}
                        </Typography>
                        <Typography variant="caption" sx={customStyles.equippedBar.menuItemDescription}>{item.description}</Typography>
                    </MenuItem>
                ))}
            </Menu>

            <Menu anchorEl={armorAnchor} open={Boolean(armorAnchor)} onClose={() => setArmorAnchor(null)}
                  PaperProps={{sx: menuPaperStyle}}>

                {/* Unequip Option */}
                {equippedArmor?.key && (
                    <>
                    <MenuItem
                        onClick={() => {
                            unequipArmor();
                            setArmorAnchor(null);
                        }}
                        sx={{...menuItemStyle, ...customStyles.equippedBar.menuUnequipItem}}
                        data-testid="unequip-armor-option"
                    >
                        {t('equipment.unequip')} {equippedArmor.name}
                    </MenuItem>
                    {inventoryArmor.length !== 0 && <Divider sx={customStyles.equippedBar.menuDivider}/>}
                    </>
                )}


                {inventoryArmor.map(({item, index, quantity}) => (
                    <MenuItem key={`${item.key}-${index}`} onClick={() => handleSelectArmor(index)} sx={menuItemStyle} data-testid={`equip-armor-option-${index}`}>
                        <Typography sx={customStyles.equippedBar.menuItemName}>
                            {item.name} {quantity > 1 ? `x${quantity}` : ''}
                        </Typography>
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
