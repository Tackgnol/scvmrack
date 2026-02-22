import {useCharacter} from "@/CharacterContext/CharacterContext.tsx";
import {Box, Paper, Typography} from '@mui/material';
import {customStyles} from '../theme/morkBorgTheme';
import {useTranslation} from 'react-i18next';

const DEFAULT_MAX_USES = 4;

interface UsePipProps {
    used: boolean;
    onClick: () => void;
}

function UsePip({used, onClick}: UsePipProps) {
    return (
        <Box
            onClick={onClick}
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
    onToggleUse: (useIndex: number) => void;
}

function PowerRow({number, name, description, uses, onToggleUse}: PowerRowProps) {
    return (
        <Box sx={customStyles.powersSection.powerRow}>
            <Typography sx={customStyles.powersSection.powerNumber}>
                {number}
            </Typography>

            <Box>
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
                    <UsePip key={useIndex} used={used} onClick={() => onToggleUse(useIndex)}/>
                ))}
            </Box>
        </Box>
    );
}

function SectionLabel({label}: { label: string }) {
    return (
        <Box sx={customStyles.powersSection.sectionLabel}>
            {label}
        </Box>
    );
}

export default function PowersSection() {
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
        <Paper sx={customStyles.powersSection.paper}>
            <SectionLabel label={t('powers.title')}/>
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
                            onToggleUse={(useIndex) => toggleScrollUse(equipmentIndex, useIndex)}
                        />
                    );
                })}
            </Box>
        </Paper>
    );
}
