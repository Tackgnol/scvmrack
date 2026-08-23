import { useTranslation } from "react-i18next";
import type {
  ObrConnectedPlayer,
  ObrPartyRosterBindingRow,
} from "@/obr/useObrRosterCards";
import {
  BindingButton,
  BindingControlsShell,
  BindingLabel,
  BindingRow,
  BindingSelect,
  StaleBadge,
} from "./ObrBindingControls.styles";

type Props = {
  row: ObrPartyRosterBindingRow;
  connectedPlayers: ObrConnectedPlayer[];
  pending: boolean;
  onAssignPlayer: (input: { characterId: string; playerId: string }) => void;
  onUnassignPlayer: (playerId: string) => void;
  onUnbindToken: (tokenId: string) => void;
};

export function ObrBindingControls({
  row,
  connectedPlayers,
  pending,
  onAssignPlayer,
  onUnassignPlayer,
  onUnbindToken,
}: Props) {
  const { t } = useTranslation();
  const boundPlayerIds = new Set(row.players.map((binding) => binding.playerId));
  const assignable = connectedPlayers.filter((p) => !boundPlayerIds.has(p.id));

  return (
    <BindingControlsShell aria-label={t("obr.gm.bindings", "Room bindings")}>
      {row.players.map((binding) => (
        <BindingRow key={binding.playerId}>
          <BindingLabel>
            {t("obr.gm.playerBinding", "Player {{id}}", {
              id: playerLabel(binding.playerId, connectedPlayers),
            })}
            {binding.stale && (
              <StaleBadge role="status">
                {t("obr.gm.stale", "STALE — not in room")}
              </StaleBadge>
            )}
          </BindingLabel>
          <BindingButton
            type="button"
            disabled={pending}
            onClick={() => onUnassignPlayer(binding.playerId)}
          >
            {t("obr.gm.clearBinding", "Clear")}
          </BindingButton>
        </BindingRow>
      ))}
      {row.tokens.map((binding) => (
        <BindingRow key={binding.tokenId}>
          <BindingLabel>
            {t("obr.gm.tokenBinding", "Token")}
            {binding.stale && (
              <StaleBadge role="status">
                {t("obr.gm.staleToken", "STALE — not in scene")}
              </StaleBadge>
            )}
          </BindingLabel>
          <BindingButton
            type="button"
            disabled={pending}
            onClick={() => onUnbindToken(binding.tokenId)}
          >
            {t("obr.gm.unbindToken", "Unbind")}
          </BindingButton>
        </BindingRow>
      ))}
      {assignable.length > 0 && (
        <BindingSelect
          aria-label={t("obr.gm.assignTo", "Assign to player")}
          disabled={pending}
          value=""
          onChange={(event) => {
            if (event.target.value) {
              onAssignPlayer({
                characterId: row.characterId,
                playerId: event.target.value,
              });
            }
          }}
        >
          <option value="">{t("obr.gm.assignTo", "Assign to player")}</option>
          {assignable.map((p) => (
            <option key={`${p.id}:${p.connectionId ?? ""}`} value={p.id}>
              {p.name ?? p.id}
            </option>
          ))}
        </BindingSelect>
      )}
    </BindingControlsShell>
  );
}

function playerLabel(
  playerId: string,
  connectedPlayers: ObrConnectedPlayer[],
): string {
  return (
    connectedPlayers.find((player) => player.id === playerId)?.name ??
    playerId
  );
}
