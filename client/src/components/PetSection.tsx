import { useCharacter } from '@/CharacterContext/CharacterContext.tsx';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { customStyles } from '../theme/morkBorgTheme';

interface HpPipProps {
    filled: boolean;
    onClick: () => void;
}

function HpPip({ filled, onClick }: HpPipProps) {
    return (
        <Box
            onClick={onClick}
            sx={{
                ...customStyles.powersSection.usePip.base,
                ...(filled ? customStyles.powersSection.usePip.used : customStyles.powersSection.usePip.unused),
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
    const { character, toggleScrollUse } = useCharacter();
    const { t } = useTranslation();

    const petsWithIndices = (character?.equipment ?? [])
        .map((item, index) => ({ item, equipmentIndex: index }))
        .filter(({ item }) => isPetItem(item));

    if (petsWithIndices.length === 0) {
        return null;
    }

    return (
        <Box sx={customStyles.powersSection.container}>
            {showLabel && (
                <Typography variant="h3" sx={customStyles.powersSection.sectionLabel}>
                    {t('pets.title')}
                </Typography>
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

                            <Box sx={{ flex: 1, minWidth: 0 }}>
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

                            <Box
                                sx={{
                                    ...customStyles.powersSection.usePipsContainer,
                                    flexWrap: 'wrap',
                                    rowGap: 0.6,
                                }}
                            >
                                {hpPips.map((filled, hpIndex) => (
                                    <HpPip
                                        key={hpIndex}
                                        filled={filled}
                                        onClick={() => toggleScrollUse(equipmentIndex, hpIndex)}
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
