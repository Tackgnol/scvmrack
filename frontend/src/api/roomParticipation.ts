import { client } from "@/api";
import { unwrapApiResult } from "@/api/clientResult";
import type { ApiOk } from "@/api";
import { obrKeys } from "./obrKeys";

export type RoomParticipation = ApiOk<"/api/obr/rooms/{roomId}/participation">;
export type SceneCleanup = RoomParticipation["cleanup"][number];

export const participationKey = obrKeys.participation;

export function fetchRoomParticipation(
  roomId: string,
): Promise<RoomParticipation> {
  return client
    .GET("/api/obr/rooms/{roomId}/participation", {
      params: { path: { roomId } },
    })
    .then((result) =>
      unwrapApiResult(result, "Failed to load room participation"),
    );
}

export function removeRoomCharacter(
  roomId: string,
  characterId: string,
  operationId: string,
): Promise<RoomParticipation> {
  return client
    .POST("/api/obr/rooms/{roomId}/participation/remove", {
      params: { path: { roomId } },
      body: { characterId, operationId },
    })
    .then((result) => unwrapApiResult(result, "Room removal rejected"));
}

export function acknowledgeSceneCleanup(
  roomId: string,
  id: string,
): Promise<RoomParticipation> {
  return client
    .POST("/api/obr/rooms/{roomId}/participation/cleanup/{id}/ack", {
      params: { path: { roomId, id } },
    })
    .then((result) =>
      unwrapApiResult(result, "Failed to acknowledge scene cleanup"),
    );
}
