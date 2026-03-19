import { useCharacter } from '@/CharacterContext/CharacterContext.tsx';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@mui/system';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { customStyles } from '../theme/morkBorgTheme';

const PIP_SAVE_PULSE = keyframes`
    0% {
        transform: scale(0.9);
        opacity: 0.9;
    }
    100% {
        transform: scale(1.25);
        opacity: 0;
    }
`;

interface HpPipProps {
    filled: boolean;
    isPending: boolean;
    ariaLabel: string;
    onClick: () => void;
}

function HpPip({ filled, isPending, ariaLabel, onClick }: HpPipProps) {
    return (
        <Box
            component="button"
            type="button"
            onClick={onClick}
            aria-label={ariaLabel}
            aria-pressed={filled}
            aria-busy={isPending}
            sx={{
                ...customStyles.powersSection.usePip.base,
                ...(filled ? customStyles.powersSection.usePip.used : customStyles.powersSection.usePip.unused),
                ...(isPending && {
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        width: { xs: 20, sm: 18 },
                        height: { xs: 20, sm: 18 },
                        borderRadius: '50%',
                        border: '2px solid rgba(10, 10, 10, 0.65)',
                        animation: `${PIP_SAVE_PULSE} 650ms ease-out infinite`,
                        pointerEvents: 'none',
                    },
                }),
            }}
        />
    );
}

function isPetItem(item: { key?: string; tags?: string[] }): boolean {
    const tags = item.tags ?? [];
    const key = item.key ?? '';
    return tags.includes('pet') || key.startsWith('pet.') || key.startsWith('pets.');
}

function formatActionDie(dice?: number[]): string {
    if (!dice || dice.length === 0) {
        return '-';
    }

    const normalized = dice
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0);

    if (normalized.length === 0) {
        return '-';
    }

    return normalized.map((value) => `d${value}`).join(' + ');
}

interface PetSectionProps {
    showLabel?: boolean;
}

export default function PetSection({ showLabel = true }: PetSectionProps) {
    const { character, toggleScrollUse, isSaving } = useCharacter();
    const { t } = useTranslation();
    const [pendingPips, setPendingPips] = useState<Set<string>>(new Set());

    const petsWithIndices = (character?.equipment ?? [])
        .map((item, index) => ({ item, equipmentIndex: index }))
        .filter(({ item }) => isPetItem(item));

    useEffect(() => {
        if (!isSaving && pendingPips.size > 0) {
            setPendingPips(new Set());
        }
    }, [isSaving, pendingPips]);

    const markPipPending = (equipmentIndex: number, useIndex: number) => {
        const pipKey = `${equipmentIndex}:${useIndex}`;
        setPendingPips((previous) => {
            if (previous.has(pipKey)) {
                return previous;
            }
            const next = new Set(previous);
            next.add(pipKey);
            return next;
        });
        toggleScrollUse(equipmentIndex, useIndex);
    };

    const hasPendingPipSave = isSaving && pendingPips.size > 0;

    if (petsWithIndices.length === 0) {
        return null;
    }

    return (
        <Box sx={customStyles.powersSection.container}>
            {showLabel && (
                <Box sx={customStyles.powersSection.sectionLabel}>
                    <Typography variant="h3" sx={{ color: 'inherit', font: 'inherit', p: 0, m: 0 }}>
                        {t('pets.title')}
                    </Typography>
                    {hasPendingPipSave && (
                        <Typography
                            component="span"
                            aria-live="polite"
                            sx={customStyles.powersSection.savingIndicator}
                        >
                            {t('status.saving', 'Saving...')}
                        </Typography>
                    )}
                </Box>
            )}
            <Box sx={customStyles.powersSection.contentContainer}>
                {petsWithIndices.map(({ item, equipmentIndex }, displayIndex) => {
                    const hpPips = item.uses ?? [];
                    return (
                        <Box
                            key={item.key ?? equipmentIndex}
                            sx={customStyles.powersSection.powerRow}
                        >
                            <Typography sx={customStyles.powersSection.powerNumber}>
                                {displayIndex + 1}
                            </Typography>

                            <Box sx={customStyles.powersSection.powerText}>
                                <Typography sx={customStyles.powersSection.powerName}>
                                    {item.name ?? t('pets.unknown')}
                                </Typography>
                                {item.description && (
                                    <Typography sx={customStyles.powersSection.powerDescription}>
                                        {item.description}
                                    </Typography>
                                )}
                                <Typography sx={customStyles.powersSection.powerDescription}>
                                    {t('pets.actionDie')}: {formatActionDie(item.dice)}
                                </Typography>
                            </Box>

                            <Box sx={customStyles.powersSection.usePipsContainer}>
                                {hpPips.map((filled, hpIndex) => (
                                    <HpPip
                                        key={hpIndex}
                                        filled={filled}
                                        isPending={hasPendingPipSave && pendingPips.has(`${equipmentIndex}:${hpIndex}`)}
                                        ariaLabel={t(
                                            'pets.hpPip',
                                            `${filled ? 'Mark hit point empty' : 'Mark hit point filled'}: ${item.name ?? t('pets.unknown')} point ${hpIndex + 1}`
                                        )}
                                        onClick={() => markPipPending(equipmentIndex, hpIndex)}
                                    />
                                ))}
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}
