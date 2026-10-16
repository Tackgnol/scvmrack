import { classKeys, publishClass } from "@/api/classes";
import MorkBorgModal, { ModalButton } from "@/components/molecules/modal/MorkBorgModal";
import { getUserFacingApiErrorMessage } from "@/utils/errorUtils";
import { Alert, Checkbox, FormControlLabel, Typography } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { PublishDialogProps } from "./PublishDialog.models";

/** Publishes a class once the author confirms they may share it. */
export function PublishDialog({ target, onClose }: PublishDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [confirmed, setConfirmed] = useState(false);
  const close = () => {
    setConfirmed(false);
    onClose();
  };
  const publish = useMutation({
    mutationFn: publishClass,
    onSuccess: () => {
      close();
      void queryClient.invalidateQueries({ queryKey: classKeys.all() });
    },
  });

  return (
    <MorkBorgModal
      open={target !== null}
      onClose={close}
      title={t("classes.publishTitle", "Publish this class?")}
      maxWidth="xs"
      actions={
        <>
          <ModalButton variant="secondary" onClick={close}>
            {t("actions.cancel", "Cancel")}
          </ModalButton>
          <ModalButton
            variant="primary"
            disabled={!confirmed || publish.isPending}
            onClick={() => target && publish.mutate(target.id)}
          >
            {publish.isPending ? t("classes.publishing", "Publishing...") : t("classes.publish", "Publish")}
          </ModalButton>
        </>
      }
    >
      {publish.error && (
        <Alert severity="error" role="alert">
          {getUserFacingApiErrorMessage(publish.error, t, t("classes.publishFailed", "The class wasn't published. Try again."))}
        </Alert>
      )}
      <Typography>
        {t(
          "classes.publishImmediate",
          "\u201c{{name}}\u201d will be public immediately and other GMs can add it to their party pools.",
          { name: target?.name ?? "" },
        )}
      </Typography>
      <FormControlLabel
        control={<Checkbox checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />}
        label={
          <>
            {t("classes.publishRights", "I made this class or have the right to share it.")}{" "}
            <Link to="/terms" hash="publishing">
              {t("footer.terms", "Terms")}
            </Link>
          </>
        }
      />
    </MorkBorgModal>
  );
}
