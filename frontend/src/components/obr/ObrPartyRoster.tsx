import type { ObrPartyRosterProps } from "./ObrPartyRoster.models";
import { cardToRosterRow, FALLBACK_MAX_MEMBERS } from "./ObrPartyRoster.utils";
import { ObrPartyRosterContainer } from "./ObrPartyRosterContainer";
import { ObrPartyRosterView } from "./ObrPartyRosterView";

export function ObrPartyRoster({
  cards,
  rows,
  maxMembers,
  ...viewProps
}: ObrPartyRosterProps) {
  const resolvedRows = cards ? cards.map(cardToRosterRow) : rows;

  if (!resolvedRows) {
    return <ObrPartyRosterContainer />;
  }

  return (
    <ObrPartyRosterView
      {...viewProps}
      rows={resolvedRows}
      maxMembers={maxMembers ?? FALLBACK_MAX_MEMBERS}
    />
  );
}

export type { ObrPartyRosterCard } from "@/obr/useObrRosterCards";
