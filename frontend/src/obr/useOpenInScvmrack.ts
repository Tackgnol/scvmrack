import { openObrSessionTab } from "@/auth/obrAuthClient";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useOwlbear } from "./owlbear";

/**
 * Opens a scvm in a full scvmrack tab through an opener-bound, one-use session
 * transfer; when the browser blocks the tab, Owlbear shows an error instead.
 */
export function useOpenInScvmrack() {
  const owlbear = useOwlbear();
  const { t } = useTranslation();
  const [isOpening, setIsOpening] = useState(false);

  async function openInScvmrack(characterId: string) {
    setIsOpening(true);
    try {
      await openObrSessionTab(
        `/obr-open?character=${encodeURIComponent(characterId)}`,
      );
    } catch {
      await owlbear.notify(
        t("obr.player.openInScvmrackFailed", "Could not open in scvmrack"),
        "ERROR",
      );
    }
    setIsOpening(false);
  }

  return { isOpening, openInScvmrack };
}
