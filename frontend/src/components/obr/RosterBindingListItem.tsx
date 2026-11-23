import { type ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { ObrBindingControls } from "./ObrBindingControls";
import type { RosterBindingListItemProps } from "./ObrPartyRoster.models";
import { shortId } from "./ObrPartyRoster.utils";
import { ObrPartyRosterRow } from "./ObrPartyRosterRow";
import {
  RosterBindingActions,
  RosterBindingFallback,
  RosterBindingItem,
} from "./ObrPartyRoster.styles";
import { RosterBindingButton } from "./RosterBinding.styles";

export function RosterBindingListItem({
  row,
  connectedPlayers,
  pending,
  bindSelectedToken,
  assignPlayer,
  unassignPlayer,
  unbindToken,
  onRemoveFromRoster,
  removingFromRoster = false,
}: RosterBindingListItemProps) {
  const { t } = useTranslation();
  const characterName =
    row.card?.name ??
    t("obr.roster.missingCardName", "Missing scvm {{id}}", {
      id: shortId(row.characterId),
    });
  const assignedPlayerId = row.players[0]?.playerId ?? null;
  const canBindToken = Boolean(bindSelectedToken);
  const canRemoveFromRoster = Boolean(onRemoveFromRoster);
  const hasGmControls = Boolean(assignPlayer || unassignPlayer || unbindToken);
  const gmControls: ComponentProps<typeof ObrBindingControls> | null =
    hasGmControls
      ? {
          row,
          connectedPlayers,
          pending,
          onAssignPlayer: (input) => void assignPlayer?.(input),
          onUnassignPlayer: (playerId) => void unassignPlayer?.(playerId),
          onUnbindToken: (tokenId) => void unbindToken?.(tokenId),
        }
      : null;

  return (
    <RosterBindingItem>
      {row.card ? (
        <ObrPartyRosterRow card={row.card} row={row} gmControls={gmControls} />
      ) : (
        <>
          <RosterBindingFallback>
            {t("obr.roster.missingCard", "Scvm not found {{id}}", {
              id: row.characterId,
            })}
          </RosterBindingFallback>
          {gmControls && <ObrBindingControls {...gmControls} />}
        </>
      )}

      {(canBindToken || canRemoveFromRoster) && (
        <RosterBindingActions>
          {canBindToken && (
            <RosterBindingButton
              type="button"
              disabled={pending}
              onClick={() =>
                void bindSelectedToken?.({
                  characterId: row.characterId,
                  characterName,
                  playerId: assignedPlayerId,
                })
              }
            >
              {t("obr.roster.bindSelectedToken", "Bind selected token")}
            </RosterBindingButton>
          )}
          {canRemoveFromRoster && (
            <RosterBindingButton
              type="button"
              disabled={pending || removingFromRoster}
              onClick={() => void onRemoveFromRoster?.(row.characterId)}
            >
              {removingFromRoster
                ? t("obr.roster.removingFromRoster", "Removing")
                : t("obr.roster.removeFromRoster", "Remove from roster")}
            </RosterBindingButton>
          )}
        </RosterBindingActions>
      )}
    </RosterBindingItem>
  );
}
