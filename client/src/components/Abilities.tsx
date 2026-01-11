import AbilityCard from "@components/AbilityCard.tsx";
import {Box, Typography} from "@mui/material";
import {customStyles} from "@theme/morkBorgTheme.ts";
import {useTranslation} from 'react-i18next';

export const Abilities = () => {
    const {t} = useTranslation();

    return (
        <Box sx={customStyles.abilities.container}>
            <Typography variant="h3" sx={customStyles.abilities.title}>
                {t('character.abilities')}
            </Typography>
            <Box sx={customStyles.abilities.grid}>
                <AbilityCard ability="agility" rotate={-0.6}/>
                <AbilityCard ability="presence" rotate={0.6}/>
                <AbilityCard ability="strength" rotate={-0.6}/>
                <AbilityCard ability="toughness" rotate={0.6}/>
            </Box>
        </Box>
    );
}
