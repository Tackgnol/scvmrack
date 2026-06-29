import OBR from "@owlbear-rodeo/sdk";
import { useCallback, useEffect, useState } from "react";
import {
  createEnemy,
  deleteEnemy as deleteEnemyApi,
  fetchEnemiesFull,
  fetchEnemyCards,
  setEnemyHealth as setEnemyHealthApi,
  updateEnemy,
  type EnemyInput,
} from "@/api/enemies";
import {
  broadcastEnemiesChanged,
  isObrEnemiesBroadcast,
  OBR_ENEMIES_CHANNEL,
  type ObrEnemy,
  type ObrEnemyCard,
  type ObrEnemyView,
} from "./enemies";

const EMPTY: ObrEnemyView[] = [];

type GmOptions = { mode: "gm"; roomId: string };
type PlayerOptions = {
  mode: "player";
  roomId: string;
  characterId: string | null;
};
type Options = GmOptions | PlayerOptions;

type BaseState<TEnemy extends ObrEnemyView> = {
  enemies: TEnemy[];
  isReady: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
};

export type ObrEnemiesGmState = BaseState<ObrEnemy> & {
  saveEnemy: (enemy: ObrEnemy) => Promise<ObrEnemy>;
  deleteEnemy: (enemyId: string) => Promise<void>;
  updateEnemyHealth: (
    enemyId: string,
    currentHealth: number,
  ) => Promise<ObrEnemy>;
};

export type ObrEnemiesPlayerState = BaseState<ObrEnemyCard>;

export function useObrEnemies(options: GmOptions): ObrEnemiesGmState;
export function useObrEnemies(options: PlayerOptions): ObrEnemiesPlayerState;
export function useObrEnemies(
  options: Options,
): ObrEnemiesGmState | ObrEnemiesPlayerState {
  const [enemies, setEnemies] = useState<ObrEnemyView[]>(EMPTY);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const roomId = options.roomId;
  const mode = options.mode;
  const characterId = mode === "player" ? options.characterId : null;

  const refresh = useCallback(async () => {
    try {
      setError(null);
      if (!roomId) {
        setEnemies(EMPTY);
        return;
      }

      if (mode === "gm") {
        setEnemies(await fetchEnemiesFull(roomId));
        return;
      }

      if (characterId) {
        setEnemies(await fetchEnemyCards(roomId, characterId));
        return;
      }

      setEnemies(EMPTY);
    } catch (refreshError) {
      setError(toError(refreshError));
      setEnemies(EMPTY);
    }
  }, [characterId, mode, roomId]);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | null = null;

    OBR.onReady(() => {
      if (!active) {
        return;
      }

      setIsReady(true);
      void refresh();
      unsubscribe = OBR.broadcast.onMessage(OBR_ENEMIES_CHANNEL, (event) => {
        if (isObrEnemiesBroadcast(event.data)) {
          void refresh();
        }
      });
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [refresh]);

  const saveEnemy = useCallback(
    async (enemy: ObrEnemy) => {
      const body = toEnemyInput(enemy);
      const saved =
        enemy.id && !enemy.id.startsWith("enemy-")
          ? await updateEnemy(roomId, enemy.id, body)
          : await createEnemy(roomId, body);
      await refresh();
      await broadcastEnemiesChanged();
      return saved;
    },
    [refresh, roomId],
  );

  const deleteEnemy = useCallback(
    async (enemyId: string) => {
      await deleteEnemyApi(roomId, enemyId);
      await refresh();
      await broadcastEnemiesChanged();
    },
    [refresh, roomId],
  );

  const updateEnemyHealth = useCallback(
    async (enemyId: string, currentHealth: number) => {
      const saved = await setEnemyHealthApi(roomId, enemyId, currentHealth);
      await refresh();
      await broadcastEnemiesChanged();
      return saved;
    },
    [refresh, roomId],
  );

  if (mode === "gm") {
    return {
      enemies: enemies as ObrEnemy[],
      isReady,
      error,
      refresh,
      saveEnemy,
      deleteEnemy,
      updateEnemyHealth,
    };
  }

  return {
    enemies: enemies as ObrEnemyCard[],
    isReady,
    error,
    refresh,
  };
}

function toEnemyInput(enemy: ObrEnemy): EnemyInput {
  return {
    name: enemy.name,
    type: enemy.type,
    habitat: enemy.habitat,
    description: enemy.description,
    playerDescription: enemy.playerDescription,
    currentHealth: enemy.currentHealth,
    maxHealth: enemy.maxHealth,
    morale: enemy.morale,
    armorDie: enemy.armorDie,
    armorDescription: enemy.armorDescription,
    attacks: enemy.attacks,
    specials: enemy.specials,
    loot: enemy.loot,
    statuses: enemy.statuses,
  };
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error("Enemy roster failed");
}
