import { usePartyLimits } from "@/hooks/usePartyRepository";
import { useObrRosterCards } from "@/obr/useObrRosterCards";
import { FALLBACK_MAX_MEMBERS } from "./ObrPartyRoster.utils";
import { ObrPartyRosterView } from "./ObrPartyRosterView";
import { ObrRoomPromotion } from "./ObrRoomPromotion";
import { ObrSceneCleanup } from "./ObrSceneCleanup/ObrSceneCleanup";

/** Live GM roster wired to the room's bindings and party limits. */
export function ObrPartyRosterContainer() {
  const roster = useObrRosterCards();
  const limits = usePartyLimits();
  return (
    <>
      <ObrSceneCleanup
        message={roster.cleanupMessage}
        pending={roster.cleanupPending}
        onRetry={roster.retrySceneCleanup}
      />
      <ObrPartyRosterView
        rows={roster.rows}
        maxMembers={limits.data?.maxMembers ?? FALLBACK_MAX_MEMBERS}
        connectedPlayers={roster.connectedPlayers}
        action={roster.action}
        onRefresh={roster.refresh}
        bindSelectedToken={
          roster.canManage ? roster.bindSelectedToken : undefined
        }
        assignPlayer={roster.canManage ? roster.assignPlayer : undefined}
        unassignPlayer={roster.canManage ? roster.unassignPlayer : undefined}
        unbindToken={roster.canManage ? roster.unbindToken : undefined}
        onRemoveFromRoster={
          roster.canManage ? roster.removeFromRoster : undefined
        }
        removeRosterAction={roster.removeRosterAction}
        promotion={<ObrRoomPromotion />}
      />
    </>
  );
}
