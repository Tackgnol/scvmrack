import React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { morkBorgTheme } from '@/theme/morkBorgTheme';
import '@/styles/global.css';
import i18n from '@/i18n';
import { I18nextProvider } from 'react-i18next';
import { LazyMotion, domMax } from 'motion/react';
import { SnackbarProvider } from '@/SnackbarContext/SnackbarProvider';

interface BrowserTestProviderProps {
  children: React.ReactNode;
}

export default function BrowserTestProvider({ children }: BrowserTestProviderProps) {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={morkBorgTheme}>
        <CssBaseline />
        <LazyMotion features={domMax}>
        <SnackbarProvider>
          <div
            style={{
              padding: '20px',
              background: '#FFE900',
              minHeight: '100vh',
              // Ensure no transitions/animations interfere with tests
            }}
            className="browser-test-wrapper"
          >
            <style dangerouslySetInnerHTML={{ __html: `
              * {
                transition: none !important;
                animation: none !important;
              }
            `}} />
            {children}
          </div>
        </SnackbarProvider>
        </LazyMotion>
      </ThemeProvider>
    </I18nextProvider>
  );
}
