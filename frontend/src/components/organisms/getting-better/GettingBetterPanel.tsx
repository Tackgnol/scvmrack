import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { ImprovementDraft } from "@/api/characterImprovementTypes";
import type { GettingBetterPreviewController } from "@/hooks/useGettingBetterPreview";
import { gettingBetterStyles as styles } from "./GettingBetterPanel.styles";
import { GettingBetterPanelSections } from "./GettingBetterPanelSections";

type PanelProps = {
  controller: GettingBetterPreviewController;
};

export function GettingBetterPanel({ controller }: PanelProps) {
  const { t } = useTranslation();
  const draft = controller.workingDraft;
  const busy =
    controller.isLoadingPreview ||
    controller.isRerolling ||
    controller.isApplying;
  const specialtyName = (key: string) =>
    controller.preview?.scumSpecialtyNames?.[key] ?? key;
  const updateDraft = (
    updater: (draft: ImprovementDraft) => ImprovementDraft,
  ) => {
    controller.setWorkingDraft((current) =>
      current ? updater(current) : current,
    );
  };

  if (controller.isLoadingPreview && !draft) {
    return (
      <Box sx={styles.panel}>
        <Typography variant="h3" sx={styles.title}>
          {t("gettingBetter.title", "Get better")}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <CircularProgress size={24} />
          <Typography sx={styles.muted}>
            {t("gettingBetter.loading", "Rolling the table")}
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!draft) return null;

  return (
    <Box sx={styles.panel} data-testid="getting-better-panel">
      <Typography variant="h3" sx={styles.title}>
        {t("gettingBetter.title", "Get better")}
      </Typography>

      <GettingBetterPanelSections
        draft={draft}
        busy={busy}
        specialtyName={specialtyName}
        updateDraft={updateDraft}
        rerollSection={controller.rerollSection}
      />

      {controller.staleConflict && (
        <Box sx={styles.warning}>
          {t(
            "gettingBetter.stale",
            "This preview is stale. Reroll from the current sheet before applying.",
          )}
        </Box>
      )}

      <Box sx={styles.actionRow}>
        <Button
          variant="outlined"
          onClick={controller.undoEdits}
          disabled={busy || !controller.isDirty}
          sx={styles.actionButton}
        >
          {t("gettingBetter.actions.undo", "Undo edits")}
        </Button>
        <Button
          variant="outlined"
          onClick={() => controller.rerollSection("all")}
          disabled={busy}
          sx={styles.actionButton}
        >
          {controller.staleConflict
            ? t(
                "gettingBetter.actions.rerollCurrent",
                "Reroll from current sheet",
              )
            : t("gettingBetter.actions.rerollAll", "Reroll all")}
        </Button>
        <Button
          variant="outlined"
          onClick={controller.close}
          disabled={busy}
          sx={styles.actionButton}
        >
          {t("gettingBetter.actions.close", "Close")}
        </Button>
        <Button
          variant="contained"
          onClick={controller.apply}
          disabled={busy}
          sx={styles.applyButton}
        >
          {controller.isApplying
            ? t("gettingBetter.actions.applying", "Applying")
            : t("gettingBetter.actions.apply", "Apply getting better")}
        </Button>
      </Box>
    </Box>
  );
}

export default GettingBetterPanel;
