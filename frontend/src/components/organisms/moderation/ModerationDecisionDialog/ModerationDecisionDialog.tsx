import type { ModerationGround } from "@/api/moderation";
import { REPORT_REASONS } from "@/api/reports";
import MorkBorgModal, { ModalButton } from "@/components/molecules/modal/MorkBorgModal";
import { MenuItem, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ModerationDecisionDialogProps } from "./ModerationDecisionDialog.models";

/**
 * Confirms a takedown, hide or content removal and picks the ground its statement of reasons cites.
 * Mount it with a `key` per decision so the ground starts from the report's reason.
 */
export function ModerationDecisionDialog({ decision, onClose, onConfirm }: ModerationDecisionDialogProps) {
  const { t } = useTranslation();
  const [ground, setGround] = useState<ModerationGround>(decision?.ground ?? "other");
  const removal = decision?.action === "removeContent";
  const hide = !removal && decision?.builtIn;

  return (
    <MorkBorgModal
      role="alertdialog"
      open={decision !== null}
      onClose={onClose}
      title={
        removal
          ? t("moderation.confirmRemoveTitle", "Remove this content?")
          : hide
            ? t("moderation.confirmHideTitle", "Hide this class?")
            : t("moderation.confirmTakeDownTitle", "Take this class down?")
      }
      maxWidth="xs"
      actions={
        <>
          <ModalButton variant="secondary" onClick={onClose}>
            {t("actions.cancel", "Cancel")}
          </ModalButton>
          <ModalButton variant="danger" onClick={() => onConfirm(ground)}>
            {removal
              ? t("moderation.removeContent", "Remove content")
              : hide
                ? t("moderation.hide", "Hide")
                : t("moderation.takeDown", "Take down")}
          </ModalButton>
        </>
      }
    >
      <TextField
        select
        fullWidth
        margin="dense"
        label={t("moderation.ground", "Ground for the statement of reasons")}
        value={ground}
        onChange={(event) => setGround(event.target.value as ModerationGround)}
      >
        {REPORT_REASONS.map((reason) => (
          <MenuItem key={reason} value={reason}>
            {t(`report.reasons.${reason}`)}
          </MenuItem>
        ))}
      </TextField>
      <Typography>
        {hide
          ? t(
              "moderation.confirmHideBody",
              "\u201c{{name}}\u201d stops being offered right away and leaves every party pool. Existing characters keep it.",
              { name: decision?.className ?? "" },
            )
          : t(
              "moderation.confirmBody",
              "\u201c{{name}}\u201d version {{version}} stops being visible right away, every version of it leaves party pools, and the GM gets your reason as the statement of reasons.",
              { name: decision?.className ?? "", version: decision?.version ?? "" },
            )}
      </Typography>
    </MorkBorgModal>
  );
}
