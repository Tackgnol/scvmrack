import { type ButtonProps } from '@mui/material';
import { type ReactNode } from 'react';

export type ModalButtonVariant = 'primary' | 'secondary' | 'danger';
export type DialogMaxWidth = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type ModalButtonProps = {
  variant?: ModalButtonVariant;
  children: ReactNode;
  onClick?: () => void;
};

export type ModalActionButtonProps = ModalButtonProps &
  Omit<ButtonProps, 'variant'>;

export type MorkBorgModalProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  maxWidth?: DialogMaxWidth;
  fullWidth?: boolean;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
};
