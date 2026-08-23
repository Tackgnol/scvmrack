import { useObrRoomId } from "@/obr/useObrRoomId";
import { ObrEnemiesPanel } from "./ObrEnemies";

export function ObrEnemiesGmSlot() {
  const roomId = useObrRoomId();
  if (!roomId) return null;
  return <ObrEnemiesPanel viewerRole="GM" roomId={roomId} />;
}
