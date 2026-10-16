import { classKeys, deleteClassDraft, removeClass } from "@/api/classes";
import MorkBorgModal, { ModalButton } from "@/components/molecules/modal/MorkBorgModal";
import { useSnackbar } from "@/SnackbarContext/SnackbarProvider";
import { getUserFacingApiErrorMessage } from "@/utils/errorUtils";
import { Typography } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { RemovalDialogProps } from "./RemovalDialog.models";

/** Confirms discarding a draft or removing a class, naming what each loses. */
export function RemovalDialog({ target, onClose }: RemovalDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { showError } = useSnackbar();
  const draft = target?.kind === "draft";
  const remove = useMutation({
    mutationFn: async (input: { kind: "draft" | "class"; id: number }) => {
      if (input.kind === "draft") {
        await deleteClassDraft(input.id);
      } else {
        await removeClass(input.id);
      }
    },
    onSuccess: () => {
      onClose();
      void queryClient.invalidateQueries({ queryKey: classKeys.all() });
    },
    onError: (error, input) =>
      showError(
        getUserFacingApiErrorMessage(
          error,
          t,
          input.kind === "draft"
            ? t("classes.discardFailed", "The draft wasn't discarded. Try again.")
            : t("classes.removeFailed", "The class wasn't removed. Try again."),
        ),
      ),
  });

  return (
    <MorkBorgModal
      role="alertdialog"
      open={target !== null}
      onClose={onClose}
      title={draft ? t("classes.discardConfirm", "Discard this unfinished draft?") : t("classes.removeConfirm", "Remove this class?")}
      maxWidth="xs"
      actions={
        <>
          <ModalButton variant="secondary" onClick={onClose}>
            {t("actions.cancel", "Cancel")}
          </ModalButton>
          <ModalButton variant="danger" disabled={remove.isPending} onClick={() => target && remove.mutate(target)}>
            {draft ? t("classes.discard", "Discard") : t("classes.remove", "Remove")}
          </ModalButton>
        </>
      }
    >
      <Typography>
        {draft
          ? t("classes.discardLoss", "\u201c{{name}}\u201d will be permanently deleted.", { name: target?.name ?? "" })
          : t(
              "classes.removeLoss",
              "\u201c{{name}}\u201d will be deleted if unused. If scvm still use it, it will be archived and their rules will stay intact.",
              { name: target?.name ?? "" },
            )}
      </Typography>
    </MorkBorgModal>
  );
}
