import { CharacterPage } from "@/pages/CharacterPage";
import {
  clearCurrentSearchParam,
  OBR_EXCHANGE_TOKEN_QUERY_PARAM,
} from "@/router/navigation";
import { useEffect } from "react";

/** Old URL tokens grant no session; new transfers arrive through the receiving-tab handshake. */
export function ObrExchangeRedeemGate() {
  useEffect(() => {
    void clearCurrentSearchParam(OBR_EXCHANGE_TOKEN_QUERY_PARAM);
  }, []);
  return <CharacterPage />;
}
