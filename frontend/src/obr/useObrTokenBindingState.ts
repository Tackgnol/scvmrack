import OBR from "@owlbear-rodeo/sdk";
import { useEffect, useState } from "react";
import {
  EMPTY_SELECTION_STATE,
  getSelectedTokenBindingState,
  type SelectionBindingState,
} from "@tackgnol/rpgtools-owlbear";
import { scvmrackObrExtension } from "@/obr/extension";

export { EMPTY_SELECTION_STATE } from "@tackgnol/rpgtools-owlbear";

export function useObrTokenBindingState() {
  const [selection, setSelection] = useState<SelectionBindingState>(
    EMPTY_SELECTION_STATE,
  );

  useEffect(() => {
    let active = true;
    let unsubscribePlayer: (() => void) | null = null;
    let unsubscribeItems: (() => void) | null = null;
    let unsubscribeSceneReady: (() => void) | null = null;

    const refreshSelection = async (selectedIds?: string[]) => {
      try {
        const next = await getSelectedTokenBindingState(
          scvmrackObrExtension,
          OBR,
          selectedIds,
        );
        if (active) {
          setSelection(next);
        }
      } catch {
        if (active) {
          setSelection(EMPTY_SELECTION_STATE);
        }
      }
    };

    OBR.onReady(() => {
      if (!active) return;

      void refreshSelection();
      unsubscribePlayer = OBR.player.onChange((player) => {
        void refreshSelection(player.selection ?? []);
      });
      unsubscribeItems = OBR.scene.items.onChange(() => {
        void refreshSelection();
      });
      unsubscribeSceneReady = OBR.scene.onReadyChange((ready) => {
        if (!ready) {
          setSelection(EMPTY_SELECTION_STATE);
          return;
        }
        void refreshSelection();
      });
    });

    return () => {
      active = false;
      unsubscribePlayer?.();
      unsubscribeItems?.();
      unsubscribeSceneReady?.();
    };
  }, []);

  return { selection, setSelection };
}
