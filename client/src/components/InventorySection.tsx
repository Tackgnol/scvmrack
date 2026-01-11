import { useCharacter } from "@/CharacterContext/CharacterContext.tsx";
import { Box, Paper, TextField, Typography, Modal, IconButton } from '@mui/material';
import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { morkBorgColors } from '../theme/morkBorgTheme';

interface ItemSlotProps {
    item: { name: string; description?: string; key?: string; quantity?: number } | null;
    onChange: (name: string, description: string, quantity: number) => void;
    onDelete: () => void;
    onMoveToStorage: () => void;
    variant?: 'default' | 'onhand';
}

function ItemSlot({ item, onChange, onDelete, onMoveToStorage, variant = 'default' }: ItemSlotProps) {
    const isOnHand = variant === 'onhand';
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editName, setEditName] = useState(item?.name ?? '');
    const [editDescription, setEditDescription] = useState(item?.description ?? '');
    const [editQuantity, setEditQuantity] = useState(item?.quantity ?? 1);
    const { character, updateField } = useCharacter();

    const handleSave = () => {
        onChange(editName, editDescription, editQuantity);
        setIsModalOpen(false);
    };

    const handleSell = () => {
        const itemValue = 10;
        if (character) {
            updateField('silver', (character.silver || 0) + (itemValue * editQuantity));
        }
        onDelete();
        setIsModalOpen(false);
    };

    const handleDrop = () => {
        onDelete();
        setIsModalOpen(false);
    };

    const handleMove = () => {
        onMoveToStorage();
        setIsModalOpen(false);
    };

    return (
        <>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                {item?.quantity && item.quantity > 1 && (
                    <Box
                        sx={{
                            bgcolor: morkBorgColors.yellow,
                            color: morkBorgColors.black,
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: '0.9rem',
                            width: 28,
                            height: 28,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            border: `2px solid ${morkBorgColors.black}`,
                            fontWeight: 'bold',
                            flexShrink: 0,
                            mt: 0.5,
                        }}
                    >
                        {item.quantity}×
                    </Box>
                )}

                <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TextField
                            placeholder={isOnHand ? 'Ready item...' : 'Stored item...'}
                            value={item?.name ?? ''}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value, item?.description ?? '', item?.quantity ?? 1)}
                            variant={isOnHand ? 'standard' : 'outlined'}
                            size="small"
                            fullWidth
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: morkBorgColors.grey,
                                    fontSize: '0.8rem',
                                },
                                '& .MuiInput-root': {
                                    bgcolor: 'transparent',
                                    color: morkBorgColors.white,
                                    fontSize: '0.85rem',
                                    '&::before': { borderColor: morkBorgColors.grey },
                                    '&::after': { borderColor: morkBorgColors.pink },
                                },
                            }}
                        />
                        {item?.name && (
                            <IconButton
                                size="small"
                                onClick={() => {
                                    setEditName(item.name);
                                    setEditDescription(item.description ?? '');
                                    setEditQuantity(item.quantity ?? 1);
                                    setIsModalOpen(true);
                                }}
                                sx={{
                                    color: morkBorgColors.yellow,
                                    bgcolor: morkBorgColors.grey,
                                    width: 24,
                                    height: 24,
                                    fontSize: '0.9rem',
                                    '&:hover': {
                                        bgcolor: morkBorgColors.pink,
                                        color: morkBorgColors.black,
                                    },
                                }}
                            >
                                ⋯
                            </IconButton>
                        )}
                    </Box>

                    <TextField
                        fullWidth
                        multiline
                        placeholder="Item description..."
                        value={item?.description ?? ''}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(item?.name ?? '', e.target.value, item?.quantity ?? 1)}
                        variant="standard"
                        size="small"
                        sx={{
                            mt: 0.5,
                            '& .MuiInput-root': {
                                fontSize: '0.7rem',
                                color: morkBorgColors.white,
                                opacity: 0.8,
                                '&::before': { borderColor: 'transparent' },
                                '&:hover:not(.Mui-disabled):before': { borderColor: morkBorgColors.grey },
                                '&::after': { borderColor: morkBorgColors.yellow },
                            },
                        }}
                    />
                </Box>
            </Box>

            <Modal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Paper
                    sx={{
                        p: 3,
                        maxWidth: 500,
                        width: '90%',
                        bgcolor: morkBorgColors.black,
                        border: `3px solid ${morkBorgColors.pink}`,
                        boxShadow: `8px 8px 0 ${morkBorgColors.yellow}`,
                        maxHeight: '90vh',
                        overflow: 'auto',
                    }}
                >
                    <Typography
                        variant="h5"
                        sx={{
                            color: morkBorgColors.pink,
                            fontFamily: "'Permanent Marker', cursive",
                            mb: 2,
                            textTransform: 'uppercase',
                        }}
                    >
                        Item Details
                    </Typography>

                    <TextField
                        fullWidth
                        label="Item Name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        variant="standard"
                        sx={{
                            mb: 2,
                            '& .MuiInput-root': {
                                color: morkBorgColors.yellow,
                                fontSize: '1.1rem',
                                '&:before': { borderBottomColor: '#504c4c' },
                                '&:hover:not(.Mui-disabled):before': { borderBottomColor: morkBorgColors.yellow },
                                '&:after': { borderBottomColor: morkBorgColors.yellow },
                            },
                            '& .MuiInputLabel-root': {
                                color: '#f5f5f5',
                                '&.Mui-focused': { color: morkBorgColors.yellow },
                            },
                        }}
                    />

                    <Box sx={{ mb: 2 }}>
                        <Typography
                            sx={{
                                color: '#f5f5f5',
                                fontSize: '0.75rem',
                                mb: 1,
                            }}
                        >
                            Quantity
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box
                                component="button"
                                onClick={() => setEditQuantity(Math.max(1, editQuantity - 1))}
                                sx={{
                                    bgcolor: morkBorgColors.grey,
                                    color: morkBorgColors.white,
                                    border: `2px solid ${morkBorgColors.black}`,
                                    borderRadius: 1,
                                    width: 36,
                                    height: 36,
                                    cursor: 'pointer',
                                    fontFamily: "'Permanent Marker', cursive",
                                    fontSize: '1.2rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        bgcolor: morkBorgColors.pink,
                                        color: morkBorgColors.black,
                                    },
                                }}
                            >
                                −
                            </Box>
                            <Typography
                                sx={{
                                    color: morkBorgColors.yellow,
                                    fontFamily: "'Bebas Neue', sans-serif",
                                    fontSize: '1.8rem',
                                    minWidth: 50,
                                    textAlign: 'center',
                                }}
                            >
                                {editQuantity}
                            </Typography>
                            <Box
                                component="button"
                                onClick={() => setEditQuantity(editQuantity + 1)}
                                sx={{
                                    bgcolor: morkBorgColors.grey,
                                    color: morkBorgColors.white,
                                    border: `2px solid ${morkBorgColors.black}`,
                                    borderRadius: 1,
                                    width: 36,
                                    height: 36,
                                    cursor: 'pointer',
                                    fontFamily: "'Permanent Marker', cursive",
                                    fontSize: '1.2rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        bgcolor: morkBorgColors.pink,
                                        color: morkBorgColors.black,
                                    },
                                }}
                            >
                                +
                            </Box>
                        </Box>
                    </Box>

                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Description"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        variant="standard"
                        placeholder="What does this item do?"
                        sx={{
                            mb: 3,
                            '& .MuiInput-root': {
                                color: '#f5f5f5',
                                '&:before': { borderBottomColor: '#504c4c' },
                                '&:hover:not(.Mui-disabled):before': { borderBottomColor: morkBorgColors.yellow },
                                '&:after': { borderBottomColor: morkBorgColors.yellow },
                            },
                            '& .MuiInputLabel-root': {
                                color: '#f5f5f5',
                                '&.Mui-focused': { color: morkBorgColors.yellow },
                            },
                        }}
                    />

                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Box
                            component="button"
                            onClick={handleMove}
                            sx={{
                                flex: 1,
                                bgcolor: 'transparent',
                                color: morkBorgColors.yellow,
                                border: `2px solid ${morkBorgColors.yellow}`,
                                borderRadius: 1,
                                px: 2,
                                py: 1,
                                cursor: 'pointer',
                                fontFamily: "'Permanent Marker', cursive",
                                fontSize: '0.85rem',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    bgcolor: morkBorgColors.yellow,
                                    color: morkBorgColors.black,
                                },
                            }}
                        >
                            {isOnHand ? 'Backpack' : 'On Hand'}
                        </Box>

                        <Box
                            component="button"
                            onClick={handleSell}
                            sx={{
                                flex: 1,
                                bgcolor: 'transparent',
                                color: morkBorgColors.white,
                                border: `2px solid ${morkBorgColors.white}`,
                                borderRadius: 1,
                                px: 2,
                                py: 1,
                                cursor: 'pointer',
                                fontFamily: "'Permanent Marker', cursive",
                                fontSize: '0.85rem',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    bgcolor: morkBorgColors.white,
                                    color: morkBorgColors.black,
                                },
                            }}
                        >
                            Sell +{10 * editQuantity}
                        </Box>

                        <Box
                            component="button"
                            onClick={handleDrop}
                            sx={{
                                flex: 1,
                                bgcolor: 'transparent',
                                color: morkBorgColors.pink,
                                border: `2px solid ${morkBorgColors.pink}`,
                                borderRadius: 1,
                                px: 2,
                                py: 1,
                                cursor: 'pointer',
                                fontFamily: "'Permanent Marker', cursive",
                                fontSize: '0.85rem',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    bgcolor: morkBorgColors.pink,
                                    color: morkBorgColors.black,
                                },
                            }}
                        >
                            Drop
                        </Box>
                    </Box>

                    <Box
                        sx={{
                            borderTop: `2px solid ${morkBorgColors.grey}`,
                            pt: 2,
                        }}
                    >
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Box
                                component="button"
                                onClick={handleSave}
                                sx={{
                                    flex: 1,
                                    bgcolor: morkBorgColors.yellow,
                                    color: morkBorgColors.black,
                                    border: `2px solid ${morkBorgColors.black}`,
                                    borderRadius: 1,
                                    px: 2,
                                    py: 1.2,
                                    cursor: 'pointer',
                                    fontFamily: "'Permanent Marker', cursive",
                                    fontSize: '1rem',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        transform: 'translate(-2px, -2px)',
                                        boxShadow: `3px 3px 0 ${morkBorgColors.black}`,
                                    },
                                }}
                            >
                                Save
                            </Box>
                            <Box
                                component="button"
                                onClick={() => setIsModalOpen(false)}
                                sx={{
                                    flex: 1,
                                    bgcolor: morkBorgColors.grey,
                                    color: morkBorgColors.white,
                                    border: `2px solid ${morkBorgColors.black}`,
                                    borderRadius: 1,
                                    px: 2,
                                    py: 1.2,
                                    cursor: 'pointer',
                                    fontFamily: "'Permanent Marker', cursive",
                                    fontSize: '1rem',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        transform: 'translate(-2px, -2px)',
                                        boxShadow: `3px 3px 0 ${morkBorgColors.black}`,
                                    },
                                }}
                            >
                                Cancel
                            </Box>
                        </Box>
                    </Box>
                </Paper>
            </Modal>
        </>
    );
}

export function OnHandSection() {
    const { character, updateField } = useCharacter();
    const onHand = character?.equipment?.slice(0, 4) ?? [];

    const handleUpdate = (index: number, name: string, description: string, quantity: number) => {
        const newEquipment = [...(character?.equipment ?? [])];
        newEquipment[index] = {
            ...newEquipment[index],
            name,
            description,
            quantity,
            key: newEquipment[index]?.key ?? `custom-${index}`,
        };
        updateField('equipment', newEquipment);
    };

    const handleDelete = (index: number) => {
        const newEquipment = [...(character?.equipment ?? [])];
        newEquipment.splice(index, 1);
        updateField('equipment', newEquipment);
    };

    const handleMoveToBackpack = (index: number) => {
        const newEquipment = [...(character?.equipment ?? [])];
        const [item] = newEquipment.splice(index, 1);
        newEquipment.push(item);
        updateField('equipment', newEquipment);
    };

    return (
        <Paper sx={{ p: 2.5, mb: 2.5, bgcolor: morkBorgColors.pink, boxShadow: `5px 5px 0 ${morkBorgColors.black}` }}>
            <Typography variant="h3" sx={{ color: morkBorgColors.black, borderBottom: `4px solid ${morkBorgColors.black}`, pb: 0.5, mb: 1.5, display: 'inline-block' }}>
                On Hand
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.25 }}>
                {onHand.map((item, index) => (
                    <Paper key={index} sx={{ p: 1.25 }}>
                        <ItemSlot
                            item={item}
                            onChange={(name, desc, qty) => handleUpdate(index, name, desc, qty)}
                            onDelete={() => handleDelete(index)}
                            onMoveToStorage={() => handleMoveToBackpack(index)}
                            variant="onhand"
                        />
                    </Paper>
                ))}
            </Box>
        </Paper>
    );
}

export function BackpackSection() {
    const { character, updateField } = useCharacter();
    const backpack = character?.equipment?.slice(4) ?? [];

    const handleUpdate = (index: number, name: string, description: string, quantity: number) => {
        const actualIndex = index + 4;
        const newEquipment = [...(character?.equipment ?? [])];
        newEquipment[actualIndex] = {
            ...newEquipment[actualIndex],
            name,
            description,
            quantity,
            key: newEquipment[actualIndex]?.key ?? `custom-${actualIndex}`,
        };
        updateField('equipment', newEquipment);
    };

    const handleDelete = (index: number) => {
        const actualIndex = index + 4;
        const newEquipment = [...(character?.equipment ?? [])];
        newEquipment.splice(actualIndex, 1);
        updateField('equipment', newEquipment);
    };

    const handleMoveToOnHand = (index: number) => {
        const actualIndex = index + 4;
        const newEquipment = [...(character?.equipment ?? [])];
        const [item] = newEquipment.splice(actualIndex, 1);
        newEquipment.splice(0, 0, item);
        updateField('equipment', newEquipment);
    };

    return (
        <Paper sx={{ p: 2.5, mb: 2.5, border: `3px solid ${morkBorgColors.yellow}`, position: 'relative', '&::before': { content: '"CART / BACKPACK"', position: 'absolute', top: -12, left: 15, bgcolor: morkBorgColors.yellow, color: morkBorgColors.black, fontFamily: "'Antonio', sans-serif", fontSize: '0.6rem', letterSpacing: '0.3em', px: 1.25, py: 0.4 } }}>
            <Typography variant="h3" sx={{ color: morkBorgColors.white, borderBottom: `4px solid ${morkBorgColors.yellow}`, pb: 0.5, mb: 1.5, display: 'inline-block' }}>
                Stored Items
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
                {backpack.map((item, index) => (
                    <ItemSlot
                        key={index}
                        item={item}
                        onChange={(name, desc, qty) => handleUpdate(index, name, desc, qty)}
                        onDelete={() => handleDelete(index)}
                        onMoveToStorage={() => handleMoveToOnHand(index)}
                    />
                ))}
            </Box>
        </Paper>
    );
}
