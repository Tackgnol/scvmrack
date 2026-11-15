import { useOwlbear } from "@/obr/owlbear";
import type { ObrRole } from "@/obr/owlbear.models";
import { useEffect, useState } from "react";

// OBR role only switches the iframe UI. Backend authority still comes from
// server-side ownership/session checks, not this client-reported value.
export function useObrRole(): ObrRole | null {
  const owlbear = useOwlbear();
  const [role, setRole] = useState<ObrRole | null>(null);

  useEffect(() => owlbear.watchRole(setRole), [owlbear]);

  return role;
}
