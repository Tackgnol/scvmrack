import OBR from "@owlbear-rodeo/sdk";
import { useEffect, useState } from "react";

export type ObrRole = "GM" | "PLAYER";

// OBR role only switches the iframe UI. Backend authority still comes from
// server-side ownership/session checks, not this client-reported value.
export function useObrRole(): ObrRole | null {
  const [role, setRole] = useState<ObrRole | null>(null);

  useEffect(() => {
    let active = true;
    let unsubscribePlayerChange: (() => void) | null = null;

    OBR.onReady(async () => {
      if (!active) return;

      const initialRole = await OBR.player.getRole();
      if (!active) return;

      setRole(initialRole);
      unsubscribePlayerChange = OBR.player.onChange((player) => {
        setRole(player.role);
      });
    });

    return () => {
      active = false;
      unsubscribePlayerChange?.();
    };
  }, []);

  return role;
}
