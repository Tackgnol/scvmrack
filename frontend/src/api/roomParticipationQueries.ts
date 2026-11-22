import type { QueryClient } from "@tanstack/react-query";
import {
  fetchRoomParticipation,
  participationKey,
} from "@/api/roomParticipation";

/** React Query options for a room's participation snapshot. */
export function roomParticipationOptions(roomId: string) {
  return {
    queryKey: participationKey(roomId),
    queryFn: () => fetchRoomParticipation(roomId),
    enabled: Boolean(roomId),
  };
}

/** Reads the room's participation from the server, dropping reads started before a change. */
export async function fetchCurrentRoomParticipation(
  queryClient: QueryClient,
  roomId: string,
) {
  await queryClient.cancelQueries({ queryKey: participationKey(roomId) });
  return queryClient.fetchQuery({
    ...roomParticipationOptions(roomId),
    staleTime: 0,
  });
}
