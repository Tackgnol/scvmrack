import { enemyErrorMessage } from "./enemyErrorMessage";

type Translate = (key: string, fallback: string) => string;

export type EnemyLoad<E> = { enemy: E } | { message: string };

/** The loaded enemy, or the status message to show in its place. */
export function enemyLoadStatus<E>(
  state: { isReady: boolean; error: Error | null },
  enemy: E | undefined,
  t: Translate,
): EnemyLoad<E> {
  if (!state.isReady) {
    return { message: t("obr.enemies.loading", "Loading enemies") };
  }
  if (state.error) {
    return {
      message: enemyErrorMessage(
        state.error,
        t("obr.enemies.loadFailed", "Could not load enemies"),
        t,
      ),
    };
  }
  if (!enemy) {
    return { message: t("obr.enemies.notFound", "Enemy not found") };
  }
  return { enemy };
}
