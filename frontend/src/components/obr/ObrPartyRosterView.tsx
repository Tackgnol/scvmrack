import { useTranslation } from "react-i18next";
import type { ObrConnectedPlayer } from "@/obr/useObrRosterCards";
import type { ObrPartyRosterViewProps } from "./ObrPartyRoster.models";
import { RosterBindingListItem } from "./RosterBindingListItem";
import {
  RosterActionMessage,
  RosterBindingButton,
  RosterEmpty,
  RosterHeader,
  RosterList,
  RosterShell,
  RosterTitle,
} from "./ObrPartyRoster.styles";

const NO_CONNECTED_PLAYERS: ObrConnectedPlayer[] = [];

export function ObrPartyRosterView({
  rows,
  maxMembers,
  promotion = null,
  connectedPlayers = NO_CONNECTED_PLAYERS,
  action = null,
  onRefresh,
  bindSelectedToken,
  assignPlayer,
  unassignPlayer,
  unbindToken,
  onRemoveFromRoster,
  removeRosterAction = null,
}: ObrPartyRosterViewProps) {
  const { t } = useTranslation();

  return (
    <RosterShell aria-label="GM party roster">
      <RosterHeader>
        <RosterTitle>
          {t("obr.roster.title", "GM · OVERVIEW {{count}}/{{max}}", {
            count: rows.length,
            max: maxMembers,
          })}
        </RosterTitle>
        {onRefresh && (
          <RosterBindingButton
            type="button"
            disabled={action?.pending ?? false}
            onClick={() => void onRefresh()}
          >
            {t("obr.roster.refresh", "Refresh")}
          </RosterBindingButton>
        )}
        {promotion}
      </RosterHeader>

      {action?.message && (
        <RosterActionMessage>{action.message}</RosterActionMessage>
      )}
      {action?.error && (
        <RosterActionMessage role="alert">{action.error}</RosterActionMessage>
      )}
      {removeRosterAction?.error && (
        <RosterActionMessage role="alert">
          {removeRosterAction.error}
        </RosterActionMessage>
      )}

      {rows.length > 0 ? (
        <RosterList aria-label="Bound scvm cards">
          {rows.map((row) => (
            <RosterBindingListItem
              key={row.id}
              row={row}
              connectedPlayers={connectedPlayers}
              pending={action?.pending ?? false}
              bindSelectedToken={bindSelectedToken}
              assignPlayer={assignPlayer}
              unassignPlayer={unassignPlayer}
              unbindToken={unbindToken}
              onRemoveFromRoster={onRemoveFromRoster}
              removingFromRoster={
                removeRosterAction?.pending &&
                removeRosterAction.characterId === row.characterId
              }
            />
          ))}
        </RosterList>
      ) : (
        <RosterEmpty role="status">
          {t(
            "obr.roster.empty",
            "No bound scvm yet. Players must bind a scvm to a token.",
          )}
        </RosterEmpty>
      )}
    </RosterShell>
  );
}
