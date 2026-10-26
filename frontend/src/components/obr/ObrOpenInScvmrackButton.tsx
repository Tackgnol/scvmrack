import { openObrSessionTab } from "@/auth/obrAuthClient";
import OBR from "@owlbear-rodeo/sdk";
import { Button } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

// Open a receiving tab with an opener-bound, one-use session transfer.
export function ObrOpenInScvmrackButton({
  characterId,
}: {
  characterId: string;
}) {
  const { t } = useTranslation();
  const [isOpening, setIsOpening] = useState(false);

  async function handleClick() {
    setIsOpening(true);
    try {
      await openObrSessionTab(
        `/obr-open?character=${encodeURIComponent(characterId)}`,
      );
    } catch {
      await OBR.notification.show(
        t("obr.player.openInScvmrackFailed", "Could not open in scvmrack"),
        "ERROR",
      );
    }
    setIsOpening(false);
  }

  return (
    <Button
      fullWidth
      variant="outlined"
      onClick={handleClick}
      disabled={isOpening}
    >
      {isOpening
        ? t("obr.player.openingInScvmrack", "Opening")
        : t("obr.player.openInScvmrack", "Open in scvmrack")}
    </Button>
  );
}
