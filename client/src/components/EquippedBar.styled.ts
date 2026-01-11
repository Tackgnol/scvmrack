import { Paper, styled } from '@mui/material';
import { customStyles } from '../theme/morkBorgTheme';

export const StyledEquipmentCard = styled(Paper, {
    shouldForwardProp: (prop) => prop !== 'hasClick',
})<{ hasClick?: boolean }>(({ hasClick }) => ({
    ...customStyles.equipmentCard.base,
    cursor: hasClick ? 'pointer' : 'default',
    '&:hover': hasClick ? customStyles.equipmentCard.hover : {},
}));
