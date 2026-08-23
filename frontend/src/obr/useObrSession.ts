import { authKeys } from '@/api';
import { obrAuthClient } from '@/auth/obrAuthClient';
import { useAuth } from '@/hooks/useAuth';
import { signInViaObrPopup } from '@tackgnol/rpgtools-shared-auth/client';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

// Session for the Owlbear Rodeo panel. `useAuth` already bootstraps an
// anonymous session and reports auth state; the popup handoff dance lives in
// shared-auth (signInViaObrPopup). Throws Error('popup-blocked') when the
// popup can't open — callers surface a click-to-open fallback.
export function useObrSession() {
    const auth = useAuth();
    const queryClient = useQueryClient();

    const signIn = useCallback(async (): Promise<void> => {
        await signInViaObrPopup(obrAuthClient, { windowName: 'scvmrack-obr-login' });
        await queryClient.invalidateQueries({ queryKey: authKeys.session() });
    }, [queryClient]);

    return { ...auth, signIn };
}
