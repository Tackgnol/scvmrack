import OBR from "@owlbear-rodeo/sdk";
import { useEffect, useState } from "react";
import {
  EMPTY_SELECTION_STATE,
  getSelectedTokenBindingState,
  type SelectionBindingState,
} from "@tackgnol/rpgtools-owlbear";
import { scvmrackObrExtension } from "@/obr/extension";
import { sdkOwlbear } from "./owlbear";

export { EMPTY_SELECTION_STATE } from "@tackgnol/rpgtools-owlbear";

/** Reads whether the selected tokens (or `selectedIds`) exist and carry a scvm binding. */
export function readSelectedTokenBindingState(selectedIds?: string[]) {
  return getSelectedTokenBindingState(scvmrackObrExtension, OBR, selectedIds);
}

export function useObrTokenBindingState() {
  const [selection, setSelection] = useState<SelectionBindingState>(
    EMPTY_SELECTION_STATE,
  );

  useEffect(
    () =>
      sdkOwlbear.whenReady((isActive) => {
        const refreshSelection = async (selectedIds?: string[]) => {
          try {
            const next = await readSelectedTokenBindingState(selectedIds);
            if (isActive()) {
              setSelection(next);
            }
          } catch {
            if (isActive()) {
              setSelection(EMPTY_SELECTION_STATE);
            }
          }
        };

        void refreshSelection();
        const unsubscribePlayer = OBR.player.onChange((player) => {
          void refreshSelection(player.selection ?? []);
        });
        const unsubscribeItems = OBR.scene.items.onChange(() => {
          void refreshSelection();
        });
        const unsubscribeSceneReady = OBR.scene.onReadyChange((ready) => {
          if (!ready) {
            setSelection(EMPTY_SELECTION_STATE);
            return;
          }
          void refreshSelection();
        });

        return () => {
          unsubscribePlayer?.();
          unsubscribeItems?.();
          unsubscribeSceneReady?.();
        };
      }),
    [],
  );

  return { selection, setSelection };
}
