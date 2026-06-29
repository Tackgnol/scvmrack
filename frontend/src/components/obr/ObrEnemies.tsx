import { bindEnemyToSelection } from "@/obr/enemies";
import { useObrEnemies } from "@/obr/useObrEnemies";
import { ObrEnemyManager } from "./enemies/ObrEnemyManager";
import { ObrEnemyPlayerPanel } from "./enemies/ObrEnemyPlayerPanel";
export { ObrEnemyWindow } from "./enemies/ObrEnemyWindow";

type ObrEnemiesPanelProps =
  | { viewerRole: "GM"; roomId: string }
  | { viewerRole: "PLAYER"; roomId: string; characterId: string | null };

export function ObrEnemiesPanel(props: ObrEnemiesPanelProps) {
  if (props.viewerRole === "GM") {
    return <ObrEnemyManagerConnected roomId={props.roomId} />;
  }

  return (
    <ObrEnemyPlayerConnected
      roomId={props.roomId}
      characterId={props.characterId}
    />
  );
}

function ObrEnemyManagerConnected({ roomId }: { roomId: string }) {
  const state = useObrEnemies({ mode: "gm", roomId });
  return <ObrEnemyManager {...state} bindEnemy={bindEnemyToSelection} />;
}

function ObrEnemyPlayerConnected({
  roomId,
  characterId,
}: {
  roomId: string;
  characterId: string | null;
}) {
  const state = useObrEnemies({ mode: "player", roomId, characterId });
  return <ObrEnemyPlayerPanel {...state} />;
}
