import OBR from "@owlbear-rodeo/sdk";
import {
  bindCurrentCharacterToSelection,
  getSelectedTokenBindingState,
} from "@tackgnol/rpgtools-owlbear";
import { scvmrackObrExtension } from "@/obr/extension";
import { obrRoomBindingsClient } from "@/obr/obrApiClient";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BindBar, BindButton, BindStatus } from "./ObrTokenBar.styles";
import {
  EMPTY_SELECTION_STATE,
  useObrTokenBindingState,
} from "@/obr/useObrTokenBindingState";

// OBR-only action strip above the sheet: bind the active scvm to the selected
// token on the map. Notifications give feedback so the player knows it landed.
export function ObrTokenBar({
  characterId,
  characterName,
}: {
  characterId: string;
  characterName: string;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const { selection, setSelection } = useObrTokenBindingState();

  async function handleBind() {
    if (!selection.hasSelection) {
      await OBR.notification.show(
        t("obr.player.selectTokenFirst", "Select a token on the map first"),
        "WARNING",
      );
      return;
    }

    setBusy(true);
    try {
      const result = await bindCurrentCharacterToSelection(
        scvmrackObrExtension,
        OBR,
        obrRoomBindingsClient,
        { characterId, characterName },
      );
      const count = result.count;
      if (count > 0) {
        const boundLabel = selection.hasBoundToken
          ? t("obr.player.reboundNotification", "Re-bound")
          : t("obr.player.boundNotification", "Bound");
        await OBR.notification.show(
          count === 1
            ? t("obr.player.bindSuccessOne", "{{action}} {{name}} to 1 token", {
                action: boundLabel,
                name: characterName,
              })
            : t(
                "obr.player.bindSuccessMany",
                "{{action}} {{name}} to {{count}} tokens",
                { action: boundLabel, name: characterName, count },
              ),
          "SUCCESS",
        );
        if (!result.metadataSynced) {
          await OBR.notification.show(
            t(
              "obr.player.bindMetadataWarning",
              "Saved binding, but the token label did not update.",
            ),
            "WARNING",
          );
        }
        setSelection(
          await getSelectedTokenBindingState(scvmrackObrExtension, OBR),
        );
      } else {
        setSelection(EMPTY_SELECTION_STATE);
        await OBR.notification.show(
          t("obr.player.selectTokenFirst", "Select a token on the map first"),
          "WARNING",
        );
      }
    } catch {
      try {
        await OBR.notification.show(
          t("obr.player.bindFailed", "Could not bind. Open a scene first."),
          "ERROR",
        );
      } catch {
        // Keep the control usable even if Owlbear drops a notification.
      }
    }
    setBusy(false);
  }

  const selectedLabel = selection.hasSelection
    ? selection.selectedCount === 1
      ? t("obr.player.oneTokenSelected", "1 token selected")
      : t("obr.player.manyTokensSelected", "{{count}} tokens selected", {
          count: selection.selectedCount,
        })
    : t("obr.player.noTokenSelected", "No token selected");
  const actionLabel = selection.hasSelection
    ? selection.hasBoundToken
      ? t("obr.player.rebindSelectedToken", "Re-bind selected token")
      : t("obr.player.bindSelectedToken", "Bind to selected token")
    : t("obr.player.selectTokenToBind", "Select token to bind");

  return (
    <BindBar>
      <BindStatus aria-live="polite">
        {selection.hasBoundToken
          ? t("obr.player.boundTokenSelected", "Bound token selected")
          : selectedLabel}
      </BindStatus>
      <BindButton
        type="button"
        onClick={handleBind}
        disabled={busy || !selection.hasSelection}
      >
        {busy ? t("obr.player.binding", "Binding") : actionLabel}
      </BindButton>
    </BindBar>
  );
}
