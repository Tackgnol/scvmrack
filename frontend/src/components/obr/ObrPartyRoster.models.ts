import type { ReactNode } from "react";
import type {
  ObrConnectedPlayer,
  ObrPartyRosterBindingRow,
  ObrPartyRosterCard,
  ObrRosterActionState,
  RemoveFromRosterState,
} from "@/obr/useObrRosterCards";

/** GM actions a roster row can trigger; each one is optional. */
export type RosterRowActions = {
  bindSelectedToken?: (input: {
    characterId: string;
    characterName: string;
    playerId?: string | null;
  }) => Promise<void>;
  assignPlayer?: (input: {
    characterId: string;
    playerId: string;
  }) => Promise<void>;
  unassignPlayer?: (playerId: string) => Promise<void>;
  unbindToken?: (tokenId: string) => Promise<void>;
  onRemoveFromRoster?: (characterId: string) => Promise<void>;
};

export type ObrPartyRosterViewProps = RosterRowActions & {
  rows: ObrPartyRosterBindingRow[];
  maxMembers: number;
  promotion?: ReactNode;
  connectedPlayers?: ObrConnectedPlayer[];
  action?: ObrRosterActionState | null;
  onRefresh?: () => Promise<void>;
  removeRosterAction?: RemoveFromRosterState;
};

export type ObrPartyRosterProps = Omit<
  ObrPartyRosterViewProps,
  "rows" | "maxMembers" | "promotion"
> & {
  cards?: ObrPartyRosterCard[];
  rows?: ObrPartyRosterBindingRow[];
  maxMembers?: number;
};

export type RosterBindingListItemProps = RosterRowActions & {
  row: ObrPartyRosterBindingRow;
  connectedPlayers: ObrConnectedPlayer[];
  pending: boolean;
  removingFromRoster?: boolean;
};
