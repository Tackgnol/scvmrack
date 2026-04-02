import { Button } from '@mui/material';
import { customStyles } from '@/theme/morkBorgTheme';
import { type ModalActionButtonProps } from '@components/modal/types';

export default function ModalButton({
  variant = 'primary',
  children,
  ...props
}: ModalActionButtonProps) {
  return (
    <Button sx={customStyles.modalButton[variant]} {...props}>
      {children}
    </Button>
  );
}
