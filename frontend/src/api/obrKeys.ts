import type { ApiLocale } from "@/api";

export const obrKeys = {
  all: ["obr"] as const,
  participations: () => [...obrKeys.all, "participation"] as const,
  participation: (roomId: string) =>
    [...obrKeys.participations(), roomId] as const,
  // Mirrors SDK 0.1.1's private roster keys; RosterLiveUpdates tests the contract.
  cards: () => [...obrKeys.all, "cards"] as const,
  cardSet: (roomId: string, ids: string[], locale?: ApiLocale) =>
    [...obrKeys.cards(), roomId, ids, locale] as const,
  bindings: (roomId: string) =>
    [...obrKeys.all, "rooms", roomId, "bindings"] as const,
};
