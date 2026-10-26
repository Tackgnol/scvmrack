export const obrKeys = {
  all: ["obr"] as const,
  participations: () => [...obrKeys.all, "participation"] as const,
  participation: (roomId: string) =>
    [...obrKeys.participations(), roomId] as const,
  // SDK 0.1.1 compatibility key; keep its cache bridge isolated here.
  bindings: (roomId: string) =>
    [...obrKeys.all, "rooms", roomId, "bindings"] as const,
};
