import { Box, styled } from '@mui/material';
import { customStyles } from '../theme/morkBorgTheme';

const buttonBase = {
  appearance: 'none',
  WebkitAppearance: 'none',
  border: 'none',
  outline: 'none',
  padding: 0,
  margin: 0,
  background: 'transparent',
  font: 'inherit',
  lineHeight: 1,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  backfaceVisibility: 'hidden' as const,
  transform: 'translateZ(0)',
  transitionProperty: 'transform, box-shadow, background-color, color',
  transitionDuration: '0.2s',
  transitionTimingFunction: 'ease',
} as const;

export const AddButton = styled('button')({
  ...buttonBase,
  ...customStyles.actionButtons.add,
  transitionProperty: 'transform, box-shadow, background-color, color',
  transitionDuration: '0.2s',
  transitionTimingFunction: 'ease',
});

export const ConfirmButton = styled('button')({
  ...buttonBase,
  ...customStyles.actionButtons.confirm,
  transitionProperty: 'transform, box-shadow, background-color, color',
  transitionDuration: '0.2s',
  transitionTimingFunction: 'ease',
});

export const CancelButton = styled('button')({
  ...buttonBase,
  ...customStyles.actionButtons.cancel,
  transitionProperty: 'transform, box-shadow, background-color, color',
  transitionDuration: '0.2s',
  transitionTimingFunction: 'ease',
});

export const BorderedContainer = styled(Box)(customStyles.containers.bordered);
