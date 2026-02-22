import { Paper, styled } from '@mui/material';
import { customStyles } from '../theme/morkBorgTheme';

export const StyledEquipmentCard = styled(Paper, {
    shouldForwardProp: (prop) => prop !== 'hasClick',
})<{ hasClick?: boolean }>(({ hasClick }) => ({
    ...customStyles.equipmentCard.base,
    transitionProperty: 'background-color, border-color, box-shadow, color',
    transitionDuration: '0.2s',
    transitionTimingFunction: 'ease',
    backfaceVisibility: 'hidden',
    willChange: 'background-color, border-color',
    contain: 'paint',
    cursor: hasClick ? 'pointer' : 'default',
    '&:hover': hasClick ? { ...customStyles.equipmentCard.hover, transform: 'none' } : {},
}));
