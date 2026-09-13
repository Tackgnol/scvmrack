import { authKeys } from "@/api";
import { obrAuthClient } from "@/auth/obrAuthClient";
import { CharacterSheetSkeleton } from "@/components/molecules/character/CharacterSheetSkeleton";
import { CharacterPage } from "@/pages/CharacterPage";
import {
  clearCurrentSearchParam,
  getCurrentSearchParamValue,
  OBR_EXCHANGE_TOKEN_QUERY_PARAM,
} from "@/router/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

// Wraps the plain `/character/$characterId` route. A tab opened via
// ObrCharacterRoute's "Open in scvmrack" button carries a one-time
// obrExchangeToken; redeem it into this tab's session *before* CharacterPage
// (and the anonymous-bootstrap it triggers via useAuth) ever mounts, so the
// character loads under the redeemed session instead of racing a fresh guest
// one. useAuth also suppresses its own anonymous bootstrap while the token is
// still in the URL, as a second line of defense against that race.
export function ObrExchangeRedeemGate() {
  const queryClient = useQueryClient();
  const [isRedeeming, setIsRedeeming] = useState(
    () => getCurrentSearchParamValue(OBR_EXCHANGE_TOKEN_QUERY_PARAM) !== null,
  );

  useEffect(() => {
    const token = getCurrentSearchParamValue(OBR_EXCHANGE_TOKEN_QUERY_PARAM);
    if (!token) return;

    let cancelled = false;
    void (async () => {
      try {
        await obrAuthClient.redeemObrExchangeToken(token);
        await queryClient.invalidateQueries({ queryKey: authKeys.session() });
      } catch {
        // A redeem can fail (expired/already-used token, network blip). Falling
        // through to the normal (guest) character-load path below beats a
        // stuck loading state.
      } finally {
        await clearCurrentSearchParam(OBR_EXCHANGE_TOKEN_QUERY_PARAM);
        if (!cancelled) setIsRedeeming(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [queryClient]);

  if (isRedeeming) {
    return <CharacterSheetSkeleton />;
  }

  return <CharacterPage />;
}
