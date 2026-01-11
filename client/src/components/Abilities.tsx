import AbilityCard from "@components/AbilityCard.tsx";
import {Box, Typography} from "@mui/material";
import {morkBorgColors} from "@theme/morkBorgTheme.ts";

export const Abilities = () => {
    {/* Abilities */
    }
    return (<Box sx={{mb: 2.5}}>
        <Typography
            variant="h3"
            sx={{
                color: morkBorgColors.black,
                borderBottom: `4px solid ${morkBorgColors.black}`,
                pb: 0.5,
                mb: 1.5,
                display: 'inline-block',
            }}
        >
            Abilities
        </Typography>
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: {xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)'},
                gap: 1.25,
            }}
        >
            <AbilityCard ability="agility" rotate={-0.6}/>
            <AbilityCard ability="presence" rotate={0.6}/>
            <AbilityCard ability="strength" rotate={-0.6}/>
            <AbilityCard ability="toughness" rotate={0.6}/>
        </Box>
    </Box>)
}
