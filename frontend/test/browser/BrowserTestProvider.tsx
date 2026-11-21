import React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { morkBorgTheme } from '@/theme/morkBorgTheme';
import '@/styles/global.css';
import i18n from '@/i18n';
import { I18nextProvider } from 'react-i18next';
import { LazyMotion, domMax } from 'motion/react';
import { SnackbarProvider } from '@/SnackbarContext/SnackbarProvider';
import { OwlbearContext } from '@/obr/OwlbearContext';
import type { Owlbear } from '@/obr/owlbear.models';

interface BrowserTestProviderProps {
  children: React.ReactNode;
  /** In-memory Owlbear for OBR components; without it they use the (usually mocked) SDK. */
  owlbear?: Owlbear;
}

export default function BrowserTestProvider({ children, owlbear }: BrowserTestProviderProps) {
  return (
    <OwlbearContext.Provider value={owlbear ?? null}>
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
    </OwlbearContext.Provider>
  );
}
