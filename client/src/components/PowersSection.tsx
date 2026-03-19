import {useCharacter} from "@/CharacterContext/CharacterContext.tsx";
import { keyframes } from '@mui/system';
import {Box, Typography} from '@mui/material';
import {customStyles} from '../theme/morkBorgTheme';
import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';

const DEFAULT_MAX_USES = 4;
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

interface UsePipProps {
    used: boolean;
    isPending: boolean;
    ariaLabel: string;
    onClick: () => void;
}

function UsePip({used, isPending, ariaLabel, onClick}: UsePipProps) {
    return (
        <Box
            component="button"
            type="button"
            onClick={onClick}
            aria-label={ariaLabel}
            aria-pressed={used}
            aria-busy={isPending}
            data-testid="power-pip"
            sx={{
                ...customStyles.powersSection.usePip.base,
                ...(used ? customStyles.powersSection.usePip.used : customStyles.powersSection.usePip.unused),
                ...(isPending && {
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        width: {xs: 20, sm: 18},
                        height: {xs: 20, sm: 18},
                        borderRadius: '50%',
                        border: '2px solid rgba(10, 10, 10, 0.65)',
                        animation: `${PIP_SAVE_PULSE} 650ms ease-out infinite`,
                        pointerEvents: 'none'
                    }
                })
            }}
        />
    );
}

interface PowerRowProps {
    number: number;
    name: string;
    description?: string;
    uses: boolean[];
    isUsePending: (useIndex: number) => boolean;
    createPipLabel: (useIndex: number, used: boolean) => string;
    onToggleUse: (useIndex: number) => void;
}

function PowerRow({number, name, description, uses, isUsePending, createPipLabel, onToggleUse}: PowerRowProps) {
    return (
        <Box sx={customStyles.powersSection.powerRow}>
            <Typography sx={customStyles.powersSection.powerNumber}>
                {number}
            </Typography>

            <Box sx={customStyles.powersSection.powerText}>
                <Typography sx={customStyles.powersSection.powerName}>
                    {name}
                </Typography>
                {description && (
                    <Typography sx={customStyles.powersSection.powerDescription}>
                        {description}
                    </Typography>
                )}
            </Box>

            <Box sx={customStyles.powersSection.usePipsContainer}>
                {uses.map((used, useIndex) => (
                    <UsePip
                        key={useIndex}
                        used={used}
                        isPending={isUsePending(useIndex)}
                        ariaLabel={createPipLabel(useIndex, used)}
                        onClick={() => onToggleUse(useIndex)}
                    />
                ))}
            </Box>
        </Box>
    );
}

interface PowersSectionProps {
    showLabel?: boolean;
}

export default function PowersSection({ showLabel = true }: PowersSectionProps) {
    const {character, toggleScrollUse, isSaving} = useCharacter();
    const {t} = useTranslation();
    const [pendingPips, setPendingPips] = useState<Set<string>>(new Set());

    // Filter scrolls from equipment and track their original indices
    const scrollsWithIndices = (character?.equipment ?? [])
        .map((item, index) => ({item, equipmentIndex: index}))
        .filter(({item}) => item.key?.startsWith('scroll.'));

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

    if (scrollsWithIndices.length === 0) {
        return null;
    }

    return (
        <Box sx={customStyles.powersSection.container}>
            {showLabel && (
                <Box sx={customStyles.powersSection.sectionLabel}>
                    <Typography variant="h3" sx={{ color: 'inherit', font: 'inherit', p: 0, m: 0 }}>
                        {t('powers.title')}
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
                {scrollsWithIndices.map(({item, equipmentIndex}, displayIndex) => {
                    // Get uses from item, default to array of false
                    const uses = item.uses ?? Array(DEFAULT_MAX_USES).fill(false);

                    return (
                        <PowerRow
                            key={item.key ?? equipmentIndex}
                            number={displayIndex + 1}
                            name={item.name ?? t('powers.unknownScroll')}
                            description={item.description}
                            uses={uses}
                            isUsePending={(useIndex) => hasPendingPipSave && pendingPips.has(`${equipmentIndex}:${useIndex}`)}
                            createPipLabel={(useIndex, used) =>
                                t(
                                    'powers.usePip',
                                    `${used ? 'Mark unused' : 'Mark used'}: ${item.name ?? t('powers.unknownScroll')} use ${useIndex + 1}`
                                )
                            }
                            onToggleUse={(useIndex) => markPipPending(equipmentIndex, useIndex)}
                        />
                    );
                })}
            </Box>
        </Box>
    );
}
