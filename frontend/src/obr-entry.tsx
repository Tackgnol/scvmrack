import "./instrument";
import "@owlbear-rodeo/sdk"; // Owlbear SDK is imported only in this entry — keep it out of the main bundle.
import { CoreProviders } from "@/CoreProviders";
import { ObrLayout } from "@/ObrLayout";
import { ObrCharacterRoute } from "@/components/obr/ObrCharacterRoute";
import { ObrCardRoute } from "@/components/obr/ObrCard";
import { ObrEnemyWindow } from "@/components/obr/ObrEnemies";
import {
  isObrCardView,
  isObrEnemyView,
  registerScvmContextMenu,
} from "@/obr/contextMenu";
import { morkBorgTheme } from "@/theme/morkBorgTheme";
import { CssBaseline, ThemeProvider } from "@mui/material";
import * as Sentry from "@sentry/react";
import ReactDOM from "react-dom/client";

import "./styles/global.css";
import "./i18n";

const isCardView = isObrCardView();
const isEnemyView = isObrEnemyView();

// Both the main app and this OBR bundle report as `source: frontend`. Tag every
// event from this entry as the Owlbear surface (and which OBR view raised it) so
// GlitchTip can separate in-OBR errors from the main app. No-op when Sentry is
// disabled (dev / no DSN).
Sentry.setTag("surface", "obr");
Sentry.setTag(
  "obr_view",
  isCardView ? "card" : isEnemyView ? "enemy" : "panel",
);

if (!isCardView && !isEnemyView) {
  registerScvmContextMenu();
}

// OBR bypasses the app's router/layout (where ThemeProvider + CssBaseline live),
// so the entry supplies the Mörk Borg theme itself. The createRoot error
// handlers mirror main.tsx so uncaught render errors reach Sentry here too.
ReactDOM.createRoot(document.getElementById("root")!, {
  onUncaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
}).render(
  <CoreProviders>
    <ThemeProvider theme={morkBorgTheme}>
      <CssBaseline />
      {isCardView ? (
        <ObrCardRoute />
      ) : isEnemyView ? (
        <ObrEnemyWindow />
      ) : (
        <ObrLayout>
          <ObrCharacterRoute />
        </ObrLayout>
      )}
    </ThemeProvider>
  </CoreProviders>,
);
