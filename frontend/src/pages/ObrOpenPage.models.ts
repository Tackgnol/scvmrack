type ForgeHandoff = { token: string; roomId: string; playerId: string };
type ClassHandoff = { token: string; classId: string };

export type Handoff = ForgeHandoff | ClassHandoff;
