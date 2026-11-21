import { useOpenInScvmrack } from "@/obr/useOpenInScvmrack";
import { Button } from "@mui/material";
import { useTranslation } from "react-i18next";

// Open a receiving tab with an opener-bound, one-use session transfer.
export function ObrOpenInScvmrackButton({
  characterId,
}: {
  characterId: string;
}) {
  const { t } = useTranslation();
  const { isOpening, openInScvmrack } = useOpenInScvmrack();

  return (
    <Button
      fullWidth
      variant="outlined"
      onClick={() => void openInScvmrack(characterId)}
      disabled={isOpening}
    >
      {isOpening
        ? t("obr.player.openingInScvmrack", "Opening")
        : t("obr.player.openInScvmrack", "Open in scvmrack")}
    </Button>
  );
}
