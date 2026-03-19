import {useCharacter} from "@/CharacterContext/CharacterContext.tsx";
import {Box, Typography} from '@mui/material';
import {customStyles} from '../theme/morkBorgTheme';
import {useTranslation} from 'react-i18next';

const DEFAULT_MAX_USES = 4;

interface UsePipProps {
    used: boolean;
    ariaLabel: string;
    onClick: () => void;
}

function UsePip({used, ariaLabel, onClick}: UsePipProps) {
    return (
        <Box
            component="button"
            type="button"
            onClick={onClick}
            aria-label={ariaLabel}
            aria-pressed={used}
            data-testid="power-pip"
            sx={{
                ...customStyles.powersSection.usePip.base,
                ...(used ? customStyles.powersSection.usePip.used : customStyles.powersSection.usePip.unused)
            }}
        />
    );
}

interface PowerRowProps {
    number: number;
    name: string;
    description?: string;
    uses: boolean[];
    createPipLabel: (useIndex: number, used: boolean) => string;
    onToggleUse: (useIndex: number) => void;
}

function PowerRow({number, name, description, uses, createPipLabel, onToggleUse}: PowerRowProps) {
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
    const {character, toggleScrollUse} = useCharacter();
    const {t} = useTranslation();

    // Filter scrolls from equipment and track their original indices
    const scrollsWithIndices = (character?.equipment ?? [])
        .map((item, index) => ({item, equipmentIndex: index}))
        .filter(({item}) => item.key?.startsWith('scroll.'));

    if (scrollsWithIndices.length === 0) {
        return null;
    }

    return (
        <Box sx={customStyles.powersSection.container}>
            {showLabel && (
                <Typography variant="h3" sx={customStyles.powersSection.sectionLabel}>
                    {t('powers.title')}
                </Typography>
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
                            createPipLabel={(useIndex, used) =>
                                t(
                                    'powers.usePip',
                                    `${used ? 'Mark unused' : 'Mark used'}: ${item.name ?? t('powers.unknownScroll')} use ${useIndex + 1}`
                                )
                            }
                            onToggleUse={(useIndex) => toggleScrollUse(equipmentIndex, useIndex)}
                        />
                    );
                })}
            </Box>
        </Box>
    );
}
