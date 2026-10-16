import { disputeClassDecision } from "@/api/classes";
import { moderationKeys } from "@/api/moderation";
import MorkBorgModal, { ModalButton } from "@/components/molecules/modal/MorkBorgModal";
import { APPEAL_ADDRESS } from "@/legal/contact";
import { useSnackbar } from "@/SnackbarContext/SnackbarProvider";
import { getUserFacingApiErrorMessage } from "@/utils/errorUtils";
import { Alert, TextField, Typography } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { DisputeDialogProps } from "./DisputeDialog.models";

/** Lets the author dispute a takedown in the app, or by email. */
export function DisputeDialog({ classId, onClose }: DisputeDialogProps) {
  const { t } = useTranslation();
  const { showSuccess } = useSnackbar();
  const [text, setText] = useState("");
  const queryClient = useQueryClient();
  const dispute = useMutation({
    mutationFn: disputeClassDecision,
    onSuccess: () => {
      // A disputed report rejoins the moderation queue.
      void queryClient.invalidateQueries({ queryKey: moderationKeys.reports });
      setText("");
      onClose();
      showSuccess(t("classes.disputeSent", "Dispute sent. A person will review it and answer by email."));
    },
  });

  return (
    <MorkBorgModal
      open={classId !== null}
      onClose={onClose}
      title={t("classes.disputeTitle", "Dispute this decision")}
      maxWidth="xs"
      actions={
        <>
          <ModalButton variant="secondary" onClick={onClose}>
            {t("actions.cancel", "Cancel")}
          </ModalButton>
          <ModalButton
            variant="primary"
            disabled={!text.trim() || dispute.isPending}
            onClick={() => classId !== null && dispute.mutate({ id: classId, text })}
          >
            {t("classes.submitDispute", "Send dispute")}
          </ModalButton>
        </>
      }
    >
      {dispute.error && (
        <Alert severity="error" role="alert">
          {getUserFacingApiErrorMessage(dispute.error, t, t("classes.disputeFailed", "The dispute wasn't sent. Try again."))}
        </Alert>
      )}
      <TextField
        autoFocus
        fullWidth
        label={t("classes.disputeText", "Why should we review this decision?")}
        multiline
        minRows={4}
        value={text}
        onChange={(event) => setText(event.target.value)}
        inputProps={{ maxLength: 4000 }}
      />
      <Typography variant="body2">
        {t("classes.appealEmail", "Or email your appeal to")}{" "}
        <a href={`mailto:${APPEAL_ADDRESS}?subject=Appeal%20class%20${classId ?? ""}`}>
          {t("classes.appealEmailLink", "Appeal by email")}
        </a>
      </Typography>
    </MorkBorgModal>
  );
}
