import { ModalButton } from "@/components/molecules/modal/MorkBorgModal";
import { partyColors } from "@/theme/partyTokens";
import { Button, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { DecisionButtonsProps } from "./DecisionButtons.models";

/** The decisions a moderator can make on a report in its current state. */
export function DecisionButtons({ open, builtIn, disabled, describedBy, onDismiss, onRestore, onConfirm }: DecisionButtonsProps) {
  const { t } = useTranslation();
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1}
      sx={{ "& .MuiButton-root": { minHeight: 44 }, "& .MuiButton-root.Mui-disabled": { color: partyColors.mutedText } }}
    >
      {open ? (
        <>
          <Button aria-describedby={describedBy} disabled={disabled} onClick={onDismiss}>
            {t("moderation.dismiss", "Dismiss")}
          </Button>
          <ModalButton variant="danger" aria-describedby={describedBy} disabled={disabled} onClick={() => onConfirm("takeDown")}>
            {builtIn ? t("moderation.hide", "Hide") : t("moderation.takeDown", "Take down")}
          </ModalButton>
          {!builtIn && (
            <ModalButton
              variant="danger"
              aria-describedby={describedBy}
              disabled={disabled}
              onClick={() => onConfirm("removeContent")}
            >
              {t("moderation.removeContent", "Remove content")}
            </ModalButton>
          )}
        </>
      ) : (
        <Button color="success" variant="contained" aria-describedby={describedBy} disabled={disabled} onClick={onRestore}>
          {t("moderation.restore", "Restore")}
        </Button>
      )}
    </Stack>
  );
}
