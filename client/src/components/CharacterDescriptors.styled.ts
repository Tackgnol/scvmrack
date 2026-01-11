import { Box, styled } from '@mui/material';
import { customStyles } from '../theme/morkBorgTheme';

export const AddButton = styled(Box)(customStyles.actionButtons.add);
export const ConfirmButton = styled(Box)(customStyles.actionButtons.confirm);
export const CancelButton = styled(Box)(customStyles.actionButtons.cancel);

export const BorderedContainer = styled(Box)(customStyles.containers.bordered);
export const BorderedGreyContainer = styled(Box)(customStyles.containers.borderedGrey);
