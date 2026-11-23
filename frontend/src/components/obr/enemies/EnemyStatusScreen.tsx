import type { EnemyStatusScreenProps } from "./EnemyStatusScreen.models";
import { EmptyEnemies, EnemyShell } from "../ObrEnemies.styles";

/** Full-window status message for the enemy popover (loading, missing, errors). */
export function EnemyStatusScreen({ message }: EnemyStatusScreenProps) {
  return (
    <EnemyShell as="main">
      <EmptyEnemies role="status">{message}</EmptyEnemies>
    </EnemyShell>
  );
}
