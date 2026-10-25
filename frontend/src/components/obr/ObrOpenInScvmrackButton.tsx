import { openObrSessionTab } from "@/auth/obrAuthClient";
import OBR from "@owlbear-rodeo/sdk";
import { Button } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

// Opens the authenticated player's scvm in a plain (non-Owlbear) browser tab,
// carrying a one-time obr-exchange token so the new tab inherits this iframe's
// session — see ObrExchangeRedeemGate for the redeem side.
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
