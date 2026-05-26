import React from 'react';
import { ThemeProvider } from '@mui/material';
import { morkBorgTheme } from '@/theme/morkBorgTheme';
import i18n from '@/i18n';
import { I18nextProvider } from 'react-i18next';

interface UnitTestProviderProps {
  children: React.ReactNode;
}

export default function UnitTestProvider({ children }: UnitTestProviderProps) {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={morkBorgTheme}>{children}</ThemeProvider>
    </I18nextProvider>
  );
}
