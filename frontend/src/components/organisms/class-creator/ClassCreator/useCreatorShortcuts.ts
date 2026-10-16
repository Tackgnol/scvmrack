import { useEffect, useRef } from "react";
import { focusAfterRender } from "../creatorShared.utils";
import { isEditable, isMac } from "./ClassCreator.utils";
import type { useClassCreator } from "./useClassCreator";

type Creator = ReturnType<typeof useClassCreator>;

/**
 * The creator's keyboard shortcuts: Escape closes the open card, Ctrl/Cmd+Z and +Y (or Shift+Z)
 * undo and redo outside text fields, and Alt+←/→ move between steps. One listener for the page's
 * lifetime; it reads the newest creator state through a ref.
 */
export function useCreatorShortcuts(creator: Creator) {
  const latest = useRef(creator);
  useEffect(() => {
    latest.current = creator;
  });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const current = latest.current;
      if (event.key === "Escape" && !isEditable(event.target)) {
        if (current.openAbility !== null) {
          event.preventDefault();
          current.setOpenAbility(null);
          focusAfterRender(`abilities.${current.openAbility}`);
        } else if (current.openItem !== null) {
          event.preventDefault();
          current.setOpenItem(null);
          focusAfterRender(`items.${current.openItem}`);
        }
        return;
      }
      if (event.altKey && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
        // On macOS Option+arrow jumps words in a text field and never navigates; leave it be.
        if (isMac() && isEditable(event.target)) {
          return;
        }
        // Alt+←/→ must never reach the browser's Back/Forward.
        event.preventDefault();
        if (current.move(event.key === "ArrowLeft" ? -1 : 1)) {
          focusAfterRender(null);
        }
        return;
      }
      const key = event.key.toLowerCase();
      const redo = key === "y" || (key === "z" && event.shiftKey);
      const undo = key === "z" && !event.shiftKey;
      // Inside a field the browser's own undo applies.
      if (!(event.ctrlKey || event.metaKey) || (!undo && !redo) || isEditable(event.target)) {
        return;
      }
      event.preventDefault();
      if (redo) {
        current.redo();
      } else {
        current.undo();
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, []);
}
