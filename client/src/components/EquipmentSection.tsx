import {useCharacter} from "@/CharacterContext/CharacterContext.tsx";
import type {GearSlotProps} from '@/types';
import {Box, TextField, Typography} from '@mui/material';
import type {ChangeEvent} from 'react';
import {morkBorgColors} from '../theme/morkBorgTheme';

function GearSlot({
                      label,
                      name,
                      detail,
                      onNameChange,
                      onDetailChange,
                      detailPlaceholder,
                  }: GearSlotProps) {
    return (
        <Box
            sx={{
                bgcolor: morkBorgColors.white,
                borderLeft: `5px solid ${morkBorgColors.pink}`,
                p: 1.5,
                position: 'relative',
            }}
        >
            <Typography
                variant="subtitle2"
                sx={{
                    position: 'absolute',
                    top: 5,
                    right: 10,
                    color: morkBorgColors.pink,
                    fontSize: '0.55rem',
                }}
            >
                {label}
            </Typography>

            <TextField
                placeholder="Name..."
                value={name ?? ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => onNameChange(e.target.value)}
                variant="standard"
                fullWidth
                sx={{
                    '& .MuiInput-root': {
                        color: morkBorgColors.black,
                        fontSize: '0.9rem',
                        '&::before': {borderColor: morkBorgColors.black},
                        '&::after': {borderColor: morkBorgColors.pink},
                    },
                    '& .MuiInput-input::placeholder': {color: '#888', opacity: 1},
                }}
            />

            {onDetailChange && (
                <TextField
                    placeholder={detailPlaceholder || 'Detail...'}
                    value={detail ?? ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => onDetailChange(e.target.value)}
                    variant="standard"
                    fullWidth
                    sx={{
                        mt: 0.5,
                        '& .MuiInput-root': {
                            color: morkBorgColors.black,
                            fontSize: '0.75rem',
                            fontStyle: 'italic',
                            '&::before': {borderColor: '#aaa', borderStyle: 'dashed'},
                            '&::after': {borderColor: morkBorgColors.pink},
                        },
                        '& .MuiInput-input::placeholder': {color: '#888', opacity: 1},
                    }}
                />
            )}
        </Box>
    );
}

export function EquipmentSection() {
    const {character, updateWeaponField, updateArmorField } = useCharacter();

    const weapon = character?.equipped_weapons?.[0];
    const offhand = character?.equipped_weapons?.[1];
    const armor = character?.equipped_armor;

    return (
        <Box sx={{mb: 2.5}}>
            <Typography
                variant="h3"
                color="secondary"
                sx={{
                    borderBottom: `4px solid ${morkBorgColors.pink}`,
                    pb: 0.5,
                    mb: 1.5,
                    display: 'inline-block',
                }}
            >
                Equipped Gear
            </Typography>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'},
                    gap: 1.25,
                }}
            >
                <GearSlot
                    label="WEAPON"
                    name={weapon?.name ?? ''}
                    detail={weapon?.description}
                    onNameChange={(v) => updateWeaponField(0, 'name', v)}
                    onDetailChange={(v) => updateWeaponField(0, 'description', v)}
                    detailPlaceholder="Damage: d6"
                />
                <GearSlot
                    label="OFF-HAND"
                    name={offhand?.name ?? ''}
                    detail={offhand?.description}
                    onNameChange={(v) => updateWeaponField(1, 'name', v)}
                    onDetailChange={(v) => updateWeaponField(1, 'description', v)}
                    detailPlaceholder="+1 defense / d4"
                />
                <GearSlot
                    label="ARMOR"
                    name={armor?.name ?? ''}
                    detail={armor?.description}
                    onNameChange={(v) => updateArmorField('name', v)}
                    onDetailChange={(v) => updateArmorField('description', v)}
                    detailPlaceholder="Tier: -d4"
                />
                <GearSlot
                    label="OTHER"
                    name=""
                    detail=""
                    onNameChange={() => {
                    }}
                    onDetailChange={() => {
                    }}
                    detailPlaceholder="Effect..."
                />
            </Box>
        </Box>
    );
}
