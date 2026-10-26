import { obrKeys } from "@/api/obrKeys";
import { partyKeys } from "@/api/party";
import { discardObrSession } from "@/auth/discardObrSession";
import { tabSessionSnapshot, confirmTabSession } from "@/utils/tabSession";
import { authKeys, resetRedirectControl } from "@/api";
import { obrAuthClient } from "@/auth/obrAuthClient";
import { useAuth } from "@/hooks/useAuth";
import {
  clearCurrentSearchParam,
  SESSION_EXPIRED_QUERY_PARAM,
} from "@/router/navigation";
import { signInViaObrPopup } from "@tackgnol/rpgtools-shared-auth/client";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const attempt = useRef<AbortController | null>(null);
  useEffect(() => () => attempt.current?.abort(), []);

  function cancelSignIn() {
    attempt.current?.abort();
  }

  const signIn = useCallback(async (): Promise<void> => {
    if (attempt.current) {
      throw new Error("handoff-in-progress");
    }
    const controller = new AbortController();
    attempt.current = controller;
    const previousToken = tabSessionSnapshot();
    await signInViaObrPopup(obrAuthClient, {
      windowName: "scvmrack-obr-login",
      signal: controller.signal,
      onProgress: setSignInProgress,
    })
      .catch(async (error: unknown) => {
        if (
          (error instanceof Error &&
            error.message === "handoff-identity-mismatch") ||
          tabSessionSnapshot() !== previousToken
        ) {
          await discardObrSession(queryClient);
        }
        throw error;
      })
      .finally(() => {
        attempt.current = null;
        setSignInProgress(null);
      });
    confirmTabSession();
    resetRedirectControl();
    await clearCurrentSearchParam(SESSION_EXPIRED_QUERY_PARAM);
    await queryClient.invalidateQueries({ queryKey: authKeys.session() });
    await queryClient.invalidateQueries({ queryKey: obrKeys.all });
    await queryClient.invalidateQueries({ queryKey: partyKeys.obrRooms() });
  }, [queryClient]);

  return { ...auth, signIn, cancelSignIn, signInProgress };
}
