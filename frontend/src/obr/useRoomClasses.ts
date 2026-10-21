import { fetchClasses } from "@/api/draft";
import { useQuery } from "@tanstack/react-query";

/** The classes a room's party rolls, in `locale`; fetched only while `enabled`. */
export function useRoomClasses(roomId: string, locale: string, enabled = true) {
  return useQuery({
    queryKey: ["obr", "room-pool", roomId, locale],
    queryFn: ({ signal }) => fetchClasses(locale, signal, undefined, roomId),
    staleTime: 0,
    enabled,
  });
}
