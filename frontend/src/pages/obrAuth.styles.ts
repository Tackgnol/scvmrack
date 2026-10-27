import { customStyles } from '@/theme/morkBorgTheme';
import { Box, styled } from '@mui/material';

export const ObrAuthWrapper = styled(Box)({
  ...customStyles.yellowSurface,
  minHeight: '60vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
});
