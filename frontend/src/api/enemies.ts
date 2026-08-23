import { client } from "@/api";
import { unwrapApiResult, type ApiResult } from "@/api/clientResult";
import type { paths } from "@/api/schema";

export type EnemyAttack = { id: string; name: string; die: string };
export type EnemySpecial = { id: string; name: string; description: string };
export type EnemyLoot = { id: string; label: string; value: string };
export type EnemyStatusBand = { id: string; percent: number; label: string };

export type EnemyFull = {
  id: string;
  partyId: string;
  name: string;
  type: string;
  habitat: string;
  description: string;
  playerDescription: string;
  currentHealth: number;
  healthPercent: number;
  maxHealth: number;
  morale: number;
  armorDie: string;
  armorDescription: string;
  attacks: EnemyAttack[];
  specials: EnemySpecial[];
  loot: EnemyLoot[];
  statuses: EnemyStatusBand[];
};

export type EnemyCard = {
  id: string;
  name: string;
  type: string;
  habitat: string;
  playerDescription: string;
  healthPercent: number;
  statusId: string;
  statusLabel: string;
};

export type EnemyInput =
  paths["/api/parties/by-room/{roomId}/enemies"]["post"]["requestBody"]["content"]["application/json"];

export async function fetchEnemiesFull(roomId: string): Promise<EnemyFull[]> {
  return unwrapApiResult<EnemyFull[]>(
    (await client.GET("/api/parties/by-room/{roomId}/enemies", {
      params: { path: { roomId } },
    })) as ApiResult<EnemyFull[]>,
    "Failed to load enemies",
  );
}

export async function fetchEnemyCards(
  roomId: string,
  characterId: string,
): Promise<EnemyCard[]> {
  return unwrapApiResult<EnemyCard[]>(
    (await client.GET("/api/parties/by-room/{roomId}/enemies/cards", {
      params: { path: { roomId }, query: { characterId } },
    })) as ApiResult<EnemyCard[]>,
    "Failed to load enemy cards",
  );
}

export async function createEnemy(
  roomId: string,
  body: EnemyInput,
): Promise<EnemyFull> {
  return unwrapApiResult<EnemyFull>(
    (await client.POST("/api/parties/by-room/{roomId}/enemies", {
      params: { path: { roomId } },
      body,
    })) as ApiResult<EnemyFull>,
    "Failed to create enemy",
  );
}

export async function updateEnemy(
  roomId: string,
  enemyId: string,
  body: EnemyInput,
): Promise<EnemyFull> {
  return unwrapApiResult<EnemyFull>(
    (await client.PATCH("/api/parties/by-room/{roomId}/enemies/{enemyId}", {
      params: { path: { roomId, enemyId } },
      body,
    })) as ApiResult<EnemyFull>,
    "Failed to update enemy",
  );
}

export async function setEnemyHealth(
  roomId: string,
  enemyId: string,
  currentHealth: number,
): Promise<EnemyFull> {
  return unwrapApiResult<EnemyFull>(
    (await client.PATCH(
      "/api/parties/by-room/{roomId}/enemies/{enemyId}/health",
      {
        params: { path: { roomId, enemyId } },
        body: { currentHealth },
      },
    )) as ApiResult<EnemyFull>,
    "Failed to update enemy health",
  );
}

export async function deleteEnemy(
  roomId: string,
  enemyId: string,
): Promise<void> {
  await unwrapApiResult<void>(
    (await client.DELETE("/api/parties/by-room/{roomId}/enemies/{enemyId}", {
      params: { path: { roomId, enemyId } },
    })) as ApiResult<void>,
    "Failed to delete enemy",
  );
}
