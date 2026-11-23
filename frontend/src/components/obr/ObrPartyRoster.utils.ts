import type {
  ObrPartyRosterBindingRow,
  ObrPartyRosterCard,
} from "@/obr/useObrRosterCards";

export const FALLBACK_MAX_MEMBERS = 10;

/** Roster row for a card that has no player or token bindings. */
export function cardToRosterRow(
  card: ObrPartyRosterCard,
): ObrPartyRosterBindingRow {
  const id = card.id ?? "";
  return {
    id,
    characterId: id,
    card,
    players: [],
    tokens: [],
  };
}

export function shortId(id: string): string {
  return id.length > 8 ? id.slice(0, 8) : id;
}
