import { createRpgToolsAuthClient,
  openObrSessionTab as openSessionTab,
} from '@tackgnol/rpgtools-shared-auth/client';
import { embeddedSessionHeaders } from '@/utils/embed';
import { authHeaders, setTabSession } from "@/utils/tabSession";

// One instance serves both browsing contexts: embeddedSessionHeaders() is
// context-aware (marker inside the partitioned OBR iframe, {} in the
// first-party popup), so the right cookies are issued on both sides.
export const obrAuthClient = createRpgToolsAuthClient({
  apiBase: `${import.meta.env.VITE_BACKEND_URL || ''}/api`,
  baseHeaders: () => ({ ...embeddedSessionHeaders(), ...authHeaders() }),
  onSessionToken: setTabSession,
});

export const openObrSessionTab = (destination: string) =>
  openSessionTab(obrAuthClient, destination);
