import './instrument';
import { CoreProviders } from '@/CoreProviders';
import { initializeAnalyticsConsent } from '@/analytics/googleAnalytics';
import { RouterProvider } from '@tanstack/react-router';
import * as Sentry from '@sentry/react';
import ReactDOM from 'react-dom/client';
import { router } from './router';

import './styles/global.css';
import './i18n';

initializeAnalyticsConsent();

ReactDOM.createRoot(document.getElementById('root')!, {
    onUncaughtError: Sentry.reactErrorHandler(),
    onRecoverableError: Sentry.reactErrorHandler(),
}).render(
    <CoreProviders>
        <RouterProvider router={router} />
    </CoreProviders>
);
