import { bindEnemyToSelection } from "@/obr/enemies";
import { useObrEnemies } from "@/obr/useObrEnemies";
import { ObrEnemyGmGate } from "./enemies/ObrEnemyGmGate";
import { ObrEnemyManager } from "./enemies/ObrEnemyManager";
export { ObrEnemyWindow } from "./enemies/ObrEnemyWindow";

type ObrEnemiesPanelProps = { viewerRole: "GM"; roomId: string };

export function ObrEnemiesPanel(props: ObrEnemiesPanelProps) {
  return <ObrEnemyManagerConnected roomId={props.roomId} />;
}

function ObrEnemyManagerConnected({ roomId }: { roomId: string }) {
  return (
    <ObrEnemyGmGate roomId={roomId}>
      {() => <ObrEnemyManagerLoader roomId={roomId} />}
    </ObrEnemyGmGate>
  );
}

function ObrEnemyManagerLoader({ roomId }: { roomId: string }) {
  const state = useObrEnemies({ mode: "gm", roomId });
  return <ObrEnemyManager {...state} bindEnemy={bindEnemyToSelection} />;
}
