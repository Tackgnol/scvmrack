import { authKeys, resetRedirectControl } from "@/api";
import { obrAuthClient } from "@/auth/obrAuthClient";
import { useAuth } from "@/hooks/useAuth";
import {
  clearCurrentSearchParam,
  SESSION_EXPIRED_QUERY_PARAM,
} from "@/router/navigation";
import { signInViaObrPopup } from "@tackgnol/rpgtools-shared-auth/client";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import type { ObrSignInProgress } from "@tackgnol/rpgtools-shared-auth/client";

// Session for the Owlbear Rodeo panel. `useAuth` already bootstraps an
// anonymous session and reports auth state; the popup handoff dance lives in
// shared-auth (signInViaObrPopup). Throws Error('popup-blocked') when the
// popup can't open — callers surface a click-to-open fallback.
export function useObrSession() {
  const auth = useAuth({ bootstrapAnonymous: true });
  const queryClient = useQueryClient();

  const [signInProgress, setSignInProgress] =
    useState<ObrSignInProgress | null>(null);

  const signIn = useCallback(async (): Promise<void> => {
    await signInViaObrPopup(obrAuthClient, {
      windowName: "scvmrack-obr-login",
      onProgress: setSignInProgress,
    }).finally(() => setSignInProgress(null));
    resetRedirectControl();
    await clearCurrentSearchParam(SESSION_EXPIRED_QUERY_PARAM);
    await queryClient.invalidateQueries({ queryKey: authKeys.session() });
    await queryClient.invalidateQueries({ queryKey: ["obr"] });
    await queryClient.invalidateQueries({ queryKey: ["party", "obr-room"] });
  }, [queryClient]);

  return { ...auth, signIn, signInProgress };
}
