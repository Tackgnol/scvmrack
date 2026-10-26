import type { ObrRosterState as CoreRosterState } from "@tackgnol/rpgtools-owlbear/react-query";
import type {
  ObrCard,
  ObrPlayerCharacterBinding,
  ObrTokenCharacterBinding,
} from "@/api/obr";

export type ObrPartyRosterCard = ObrCard;
export type StalePlayerBinding = ObrPlayerCharacterBinding & { stale: boolean };
export type StaleTokenBinding = ObrTokenCharacterBinding & { stale: boolean };

export type ObrPartyRosterBindingRow = {
  id: string;
  characterId: string;
  card: ObrPartyRosterCard | null;
  players: StalePlayerBinding[];
  tokens: StaleTokenBinding[];
};

export type RemoveFromRosterState = {
  characterId: string;
  pending: boolean;
  error: string | null;
} | null;

// The SDK passes these rows through but types cards as unknown.
export type RoomRosterState = Omit<CoreRosterState, "rows" | "cards"> & {
  rows: ObrPartyRosterBindingRow[];
  cards: ObrPartyRosterCard[];
};

export type ObrRosterState = RoomRosterState & {
  removeFromRoster: (characterId: string) => Promise<void>;
  removeRosterAction: RemoveFromRosterState;
  cleanupMessage: string | null;
  cleanupPending: boolean;
  retrySceneCleanup: () => Promise<void>;
};
