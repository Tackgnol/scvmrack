import { enemyErrorMessage } from "./enemyErrorMessage";

type Translate = (key: string, fallback: string) => string;

/** Status message to show instead of an enemy, or null once the enemy is loaded. */
export function enemyLoadStatus(
  state: { isReady: boolean; error: Error | null },
  hasEnemy: boolean,
  t: Translate,
): string | null {
  if (!state.isReady) {
    return t("obr.enemies.loading", "Loading enemies");
  }
  if (state.error) {
    return enemyErrorMessage(
      state.error,
      t("obr.enemies.loadFailed", "Could not load enemies"),
      t,
    );
  }
  if (!hasEnemy) {
    return t("obr.enemies.notFound", "Enemy not found");
  }
  return null;
}
