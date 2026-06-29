import { useObrRoomId } from "@/hooks/useObrRoomId";
import { ObrEnemiesPanel } from "./ObrEnemies";

export function ObrEnemiesGmSlot() {
  const roomId = useObrRoomId();
  if (!roomId) return null;
  return <ObrEnemiesPanel viewerRole="GM" roomId={roomId} />;
}

export function ObrEnemiesPlayerSlot({
  characterId,
}: {
  characterId: string | null;
}) {
  const roomId = useObrRoomId();
  if (!roomId) return null;
  return (
    <ObrEnemiesPanel
      viewerRole="PLAYER"
      roomId={roomId}
      characterId={characterId}
    />
  );
}
