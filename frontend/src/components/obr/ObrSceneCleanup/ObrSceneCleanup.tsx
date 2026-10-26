import { Alert, Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { ObrSceneCleanupProps } from "./ObrSceneCleanup.models";

export function ObrSceneCleanup({
  message,
  pending,
  onRetry,
}: ObrSceneCleanupProps) {
  const { t } = useTranslation();
  if (!message && !pending) {
    return null;
  }
  return (
    <Alert severity={pending ? "warning" : "success"}>
      <span role="status">{message ?? t("obr.roster.cleanupPending")}</span>
      {pending && (
        <Button onClick={() => void onRetry()}>
          {t("obr.roster.retryCleanup")}
        </Button>
      )}
    </Alert>
  );
}
