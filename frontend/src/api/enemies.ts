import { client } from "@/api";
import { unwrapApiResult } from "@/api/clientResult";
import type { paths } from "@/api/schema";

type EnemiesPath = paths["/api/parties/by-room/{roomId}/enemies"];

export type EnemyFull =
  EnemiesPath["get"]["responses"][200]["content"]["application/json"][number];

export type EnemyCard =
  paths["/api/parties/by-room/{roomId}/enemies/cards"]["get"]["responses"][200]["content"]["application/json"][number];

export type EnemyInput =
  EnemiesPath["post"]["requestBody"]["content"]["application/json"];

export async function fetchEnemiesFull(roomId: string): Promise<EnemyFull[]> {
  return unwrapApiResult(
    await client.GET("/api/parties/by-room/{roomId}/enemies", {
      params: { path: { roomId } },
    }),
    "Failed to load enemies",
  );
}

export async function fetchEnemyCards(
  roomId: string,
  characterId: string,
): Promise<EnemyCard[]> {
  return unwrapApiResult(
    await client.GET("/api/parties/by-room/{roomId}/enemies/cards", {
      params: { path: { roomId }, query: { characterId } },
    }),
    "Failed to load enemy cards",
  );
}

export async function createEnemy(
  roomId: string,
  body: EnemyInput,
): Promise<EnemyFull> {
  return unwrapApiResult(
    await client.POST("/api/parties/by-room/{roomId}/enemies", {
      params: { path: { roomId } },
      body,
    }),
    "Failed to create enemy",
  );
}

export async function updateEnemy(
  roomId: string,
  enemyId: string,
  body: EnemyInput,
): Promise<EnemyFull> {
  return unwrapApiResult(
    await client.PATCH("/api/parties/by-room/{roomId}/enemies/{enemyId}", {
      params: { path: { roomId, enemyId } },
      body,
    }),
    "Failed to update enemy",
  );
}

export async function setEnemyHealth(
  roomId: string,
  enemyId: string,
  currentHealth: number,
): Promise<EnemyFull> {
  return unwrapApiResult(
    await client.PATCH(
      "/api/parties/by-room/{roomId}/enemies/{enemyId}/health",
      {
        params: { path: { roomId, enemyId } },
        body: { currentHealth },
      },
    ),
    "Failed to update enemy health",
  );
}

export async function deleteEnemy(
  roomId: string,
  enemyId: string,
): Promise<void> {
  await unwrapApiResult(
    await client.DELETE("/api/parties/by-room/{roomId}/enemies/{enemyId}", {
      params: { path: { roomId, enemyId } },
    }),
    "Failed to delete enemy",
  );
}
