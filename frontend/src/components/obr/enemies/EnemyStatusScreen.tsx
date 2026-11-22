import { EmptyEnemies, EnemyShell } from "../ObrEnemies.styles";

/** Full-window status message for the enemy popover (loading, missing, errors). */
export function EnemyStatusScreen({ message }: { message: string }) {
  return (
    <EnemyShell as="main">
      <EmptyEnemies role="status">{message}</EmptyEnemies>
    </EnemyShell>
  );
}
