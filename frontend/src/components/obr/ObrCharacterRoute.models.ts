import type { getCurrentObrRoomActor } from "@tackgnol/rpgtools-owlbear";

export type ObrRoomActor = Awaited<ReturnType<typeof getCurrentObrRoomActor>>;
