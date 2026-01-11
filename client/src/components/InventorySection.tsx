import { useState, useMemo, useEffect } from 'react';
import { useCharacter } from "@/CharacterContext/CharacterContext.tsx";
import { ItemSearchHit } from "@/hooks/useEquipmentSearch.ts";
import ItemAutocomplete from "@components/ItemAutocomplete.tsx";
import { Box, Modal, Paper, TextField, Typography, Button } from '@mui/material';
import {  customStyles } from '../theme/morkBorgTheme';
import { useTranslation } from 'react-i18next';

// --- Types ---

type EquipmentItem = {
    name?: string;
    description?: string;
    key?: string;
    uses?: boolean[];
    comments?: string;
    tags?: string[];
};

type AggregatedItem = {
    item: EquipmentItem;
    indices: number[];
    quantity: number;
};

interface ItemSlotProps {
    aggregated: AggregatedItem;
    onUpdate: (indices: number[], updated: EquipmentItem) => void;
    onDelete: (indices: number[]) => void;
    onMove: (indices: number[]) => void;
    onAdjustQuantity: (item: EquipmentItem, newTotal: number, currentIndices: number[]) => void;
    location: 'equipment' | 'storage';
}

// --- Utilities ---

const aggregateItems = (items: (EquipmentItem | null)[]): AggregatedItem[] => {
    const groups: Map<string, AggregatedItem> = new Map();

    items.forEach((item, index) => {
        if (!item) return;
        const groupKey = (item.name || 'Unknown').toLowerCase();
        const existing = groups.get(groupKey);

        if (existing) {
            existing.indices.push(index);
            existing.quantity += 1;
            if (item.comments && !existing.item.comments?.includes(item.comments)) {
                existing.item.comments = existing.item.comments
                    ? `${existing.item.comments}\n${item.comments}`
                    : item.comments;
            }
        } else {
            groups.set(groupKey, {
                item: { ...item },
                indices: [index],
                quantity: 1,
            });
        }
    });

    return Array.from(groups.values());
};

// --- Components ---

function ItemSlot({
                      aggregated,
                      onUpdate,
                      onDelete,
                      onMove,
                      onAdjustQuantity,
                      location
                  }: ItemSlotProps) {
    const { t } = useTranslation();
    const { item, indices, quantity } = aggregated;
    const isOnHand = location === 'equipment';
    const moveLabel = isOnHand ? t('equipment.moveToStorage') : t('equipment.moveToOnHand');

    const [isModalOpen, setIsModalOpen] = useState(false);

    // Local state for the form
    const [editName, setEditName] = useState(item.name ?? '');
    const [editDescription, setEditDescription] = useState(item.description ?? '');
    const [editComments, setEditComments] = useState(item.comments ?? '');
    const [localQuantity, setLocalQuantity] = useState(quantity);

    // Sync state whenever the modal opens or the underlying data changes
    useEffect(() => {
        if (isModalOpen) {
            setEditName(item.name ?? '');
            setEditDescription(item.description ?? '');
            setEditComments(item.comments ?? '');
            setLocalQuantity(quantity);
        }
    }, [isModalOpen, item, quantity]);

    const { character, updateField, equipWeapon, equipArmor } = useCharacter();

    const tags = item.tags ?? [];
    const isArmor = tags.includes('armor');
    const isWeaponOrShield = tags.includes('weapon') || tags.includes('shield');

    const handleSave = () => {
        if (localQuantity !== quantity) {
            onAdjustQuantity(item, localQuantity, indices);
        }
        onUpdate(indices, {
            ...item,
            name: editName,
            description: editDescription,
            comments: editComments,
        });
        setIsModalOpen(false);
    };

    const handleSell = () => {
        const itemValue = 10;
        if (character) {
            updateField('silver', (character.silver || 0) + (itemValue * quantity));
        }
        onDelete(indices);
        setIsModalOpen(false);
    };

    return (
        <>
            <Box onClick={() => setIsModalOpen(true)} sx={customStyles.inventorySection.itemSlot}>
                {quantity > 1 && (
                    <Box sx={quantityBadgeStyle}>{quantity}×</Box>
                )}

                <Box sx={customStyles.inventorySection.itemContent}>
                    <Typography variant="h6" sx={customStyles.inventorySection.itemName}>
                        {item.name}
                    </Typography>
                    {item.description && (
                        <Typography variant="body2" sx={customStyles.inventorySection.itemDescription}>
                            {item.description}
                        </Typography>
                    )}
                </Box>
            </Box>

            <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <Paper sx={modalPaperStyle}>
                    <Typography variant="h5" sx={modalHeaderStyle}>
                        {editName || t('equipment.itemDetails')}
                    </Typography>

                    <Box sx={customStyles.inventorySection.modalContent}>
                        <TextField
                            fullWidth
                            label={t('equipment.itemName')}
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            sx={modalInputStyles}
                        />

                        {/* Quantity UI */}
                        <Box>
                            <Typography sx={customStyles.inventorySection.quantityLabel}>
                                {t('equipment.quantity')}
                            </Typography>
                            <Box sx={customStyles.inventorySection.quantityControls}>
                                <Button onClick={() => setLocalQuantity(Math.max(1, localQuantity - 1))} sx={counterBtnStyle}>−</Button>
                                <Typography sx={customStyles.inventorySection.quantityNumber}>{localQuantity}</Typography>
                                <Button onClick={() => setLocalQuantity(localQuantity + 1)} sx={counterBtnStyle}>+</Button>
                            </Box>
                        </Box>

                        <TextField fullWidth multiline rows={2} label={t('character.description')} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} sx={modalInputStyles} />
                        <TextField fullWidth multiline rows={2} label="Comments / Notes" value={editComments} onChange={(e) => setEditComments(e.target.value)} sx={modalInputStyles} />

                        {isOnHand && (isArmor || isWeaponOrShield) && (
                            <Box sx={customStyles.inventorySection.equipButtons}>
                                {isArmor && <Button onClick={() => { equipArmor(indices[0]); setIsModalOpen(false); }} sx={equipBtnStyle} fullWidth>EQUIP ARMOR</Button>}
                                {isWeaponOrShield && (
                                    <>
                                        <Button onClick={() => { equipWeapon(indices[0], 0); setIsModalOpen(false); }} sx={equipBtnStyle} fullWidth>EQUIP SLOT 1</Button>
                                        <Button onClick={() => { equipWeapon(indices[0], 1); setIsModalOpen(false); }} sx={equipBtnStyle} fullWidth>EQUIP SLOT 2</Button>
                                    </>
                                )}
                            </Box>
                        )}

                        <Box sx={customStyles.inventorySection.actionButtons}>
                            <Button onClick={() => { onMove(indices); setIsModalOpen(false); }} sx={actionBtnStyle}>{moveLabel}</Button>
                            <Button onClick={handleSell} sx={actionBtnStyle}>{t('equipment.sell', { amount: 10 * localQuantity })}</Button>
                            <Button onClick={() => { onDelete(indices); setIsModalOpen(false); }} sx={{ ...actionBtnStyle, ...customStyles.inventorySection.dropButton }}>{t('equipment.drop')}</Button>
                        </Box>

                        <Box sx={customStyles.inventorySection.modalFooter}>
                            <Button onClick={handleSave} fullWidth sx={saveBtnStyle}>{t('equipment.save')}</Button>
                            <Button onClick={() => setIsModalOpen(false)} sx={customStyles.inventorySection.cancelButton}>{t('actions.cancel')}</Button>
                        </Box>
                    </Box>
                </Paper>
            </Modal>
        </>
    );
}

export function OnHandSection() {
    const { t } = useTranslation();
    const { character, updateEquipmentItem, removeEquipmentItem, moveToStorage, addEquipmentItem } = useCharacter();

    const equipment = character?.equipment ?? [];
    const aggregated = useMemo(() => aggregateItems(equipment), [equipment]);

    const handleAdjustQuantity = (item: EquipmentItem, newTotal: number, currentIndices: number[]) => {
        const diff = newTotal - currentIndices.length;
        if (diff > 0) {
            for (let i = 0; i < diff; i++) addEquipmentItem({ ...item });
        } else if (diff < 0) {
            // Remove from the end to keep indices stable during the loop
            [...currentIndices].slice(newTotal).reverse().forEach(idx => removeEquipmentItem(idx));
        }
    };

    const handleAddItem = async (hit: ItemSearchHit) => {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/equipment/${hit.item_type}/${hit.id}`);
        if (!response.ok) return;
        const fullItem = await response.json();
        addEquipmentItem({ ...fullItem, name: fullItem.name ?? hit.name, uses: [] });
    };

    return (
        <Paper sx={sectionPaperStyle}>
            <Typography variant="h3" sx={customStyles.inventorySection.sectionTitle}>{t('equipment.onHand')}</Typography>
            <Box sx={customStyles.inventorySection.itemsGrid}>
                {aggregated.map((group) => (
                    <Paper key={group.item.name} sx={itemRowStyle}>
                        <ItemSlot
                            aggregated={group}
                            onUpdate={(indices, updated) => indices.forEach(idx => updateEquipmentItem(idx, updated))}
                            onDelete={(indices) => [...indices].reverse().forEach(idx => removeEquipmentItem(idx))}
                            onMove={(indices) => [...indices].reverse().forEach(idx => moveToStorage(idx))}
                            onAdjustQuantity={handleAdjustQuantity}
                            location="equipment"
                        />
                    </Paper>
                ))}
            </Box>
            <Box sx={customStyles.inventorySection.addItemSection}>
                <ItemAutocomplete onSelect={handleAddItem} placeholder={t('equipment.searchPlaceholder')} />
            </Box>
        </Paper>
    );
}

export function StorageSection() {
    const { t } = useTranslation();
    const { character, updateStorageItem, removeStorageItem, moveToEquipment, addStorageItem } = useCharacter();

    const storage = character?.storage ?? [];
    const aggregated = useMemo(() => aggregateItems(storage), [storage]);

    const handleAdjustQuantity = (item: EquipmentItem, newTotal: number, currentIndices: number[]) => {
        const diff = newTotal - currentIndices.length;
        if (diff > 0) {
            for (let i = 0; i < diff; i++) addStorageItem({ ...item });
        } else if (diff < 0) {
            [...currentIndices].slice(newTotal).reverse().forEach(idx => removeStorageItem(idx));
        }
    };

    return (
        <Paper sx={sectionPaperStyle}>
            <Typography variant="h3" sx={customStyles.inventorySection.sectionTitle}>{t('equipment.storedItems')}</Typography>
            <Box sx={customStyles.inventorySection.itemsGrid}>
                {aggregated.map((group) => (
                    <Paper key={group.item.name} sx={itemRowStyle}>
                        <ItemSlot
                            aggregated={group}
                            onUpdate={(indices, updated) => indices.forEach(idx => updateStorageItem(idx, updated))}
                            onDelete={(indices) => [...indices].reverse().forEach(idx => removeStorageItem(idx))}
                            onMove={(indices) => [...indices].reverse().forEach(idx => moveToEquipment(idx))}
                            onAdjustQuantity={handleAdjustQuantity}
                            location="storage"
                        />
                    </Paper>
                ))}
            </Box>
        </Paper>
    );
}

export const BackpackSection = StorageSection;

// --- Styles ---

const sectionPaperStyle = customStyles.paper.section;
const itemRowStyle = customStyles.paper.itemRow;
const modalPaperStyle = { ...customStyles.modal.paper, minWidth: 320, maxWidth: '90vw' };
const modalHeaderStyle = customStyles.modal.header;

const quantityBadgeStyle = customStyles.quantityBadge;


const modalInputStyles = customStyles.modal.input;

const counterBtnStyle = customStyles.buttons.counter;
const actionBtnStyle = customStyles.buttons.action;
const equipBtnStyle = customStyles.buttons.equip;
const saveBtnStyle = customStyles.buttons.save;
