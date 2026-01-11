import { Box } from '@mui/material';
import type { ReactNode } from 'react';

interface FlagContainerProps {
    children: ReactNode;
}

export function FlagContainer({ children }: FlagContainerProps) {
    return (
        <Box
            sx={{
                display: 'flex',
                gap: 1,
                alignItems: 'center',
            }}
        >
            {children}
        </Box>
    );
}
