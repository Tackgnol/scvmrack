import { Box } from '@mui/material';
import type { ReactNode } from 'react';
import { customStyles } from '@/theme/morkBorgTheme';

interface FlagContainerProps {
    children: ReactNode;
}

export function FlagContainer({ children }: FlagContainerProps) {
    return (
        <Box sx={customStyles.flagContainer}>
            {children}
        </Box>
    );
}
