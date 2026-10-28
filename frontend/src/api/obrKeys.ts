export const obrKeys = {
  all: ["obr"] as const,
  participations: () => [...obrKeys.all, "participation"] as const,
  participation: (roomId: string) =>
    [...obrKeys.participations(), roomId] as const,
  // SDK 0.1.1 compatibility keys; keep its cache bridge isolated here.
  cards: () => [...obrKeys.all, "cards"] as const,
  bindings: (roomId: string) =>
    [...obrKeys.all, "rooms", roomId, "bindings"] as const,
};
