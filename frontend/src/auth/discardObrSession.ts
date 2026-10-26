import { authKeys } from "@/api";
import { obrKeys } from "@/api/obrKeys";
import { partyKeys } from "@/api/party";
import { signOut } from "@/auth";
import { quarantineTabSession } from "@/utils/tabSession";
import type { QueryClient } from "@tanstack/react-query";

/** Revoke a received identity that failed verification before exposing protected content. */
export async function discardObrSession(
  queryClient: QueryClient,
): Promise<void> {
  // Capture the received credential before clearing it locally; failed revocation stays quarantined.
  const revoking = signOut(AbortSignal.timeout(2000));
  quarantineTabSession();
  await queryClient.cancelQueries({ queryKey: authKeys.all });
  queryClient.setQueryData(authKeys.session(), null);
  queryClient.removeQueries({ queryKey: obrKeys.all });
  queryClient.removeQueries({ queryKey: partyKeys.obrRooms() });
  await revoking;
  await queryClient.invalidateQueries({ queryKey: authKeys.all });
}
