import { fetchClasses, type ClassSummary } from "@/api/draft";
import {
  Alert,
  Button,
  ButtonBase,
  CircularProgress,
  Popover,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ObrRollPickerProps } from "./ObrRollPicker.models";

export function ObrRollPicker({
  open,
  roomId,
  locale,
  onClose,
  onChoose,
}: ObrRollPickerProps) {
  const { t } = useTranslation();
  const [classes, setClasses] = useState<ClassSummary[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setClasses(null);
    setFailed(false);
    void fetchClasses(locale, controller.signal, undefined, roomId)
      .then(setClasses)
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setFailed(true);
        }
      });
    return () => controller.abort();
  }, [attempt, locale, open, roomId]);

  return (
    <Popover
      open={open}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={{ top: 24, left: window.innerWidth / 2 }}
      transformOrigin={{ vertical: "top", horizontal: "center" }}
      aria-labelledby="obr-roll-picker-title"
      slotProps={{
        paper: { sx: { width: "min(420px, calc(100vw - 32px))", maxHeight: 600 } },
      }}
    >
      <DialogTitle id="obr-roll-picker-title">
        {t("obr.player.rollPickerTitle", "Choose a class")}
      </DialogTitle>
      <DialogContent dividers>
        {failed && (
          <Alert severity="error">
            {t(
              "obr.player.rollPickerLoadError",
              "Could not load room classes.",
            )}
            <Button
              color="inherit"
              size="small"
              onClick={() => setAttempt((value) => value + 1)}
            >
              {t("common.retry", "Retry")}
            </Button>
          </Alert>
        )}
        {!classes && !failed && (
          <CircularProgress aria-label={t("common.loading", "Loading")} />
        )}
        {classes && (
          <Stack spacing={1}>
            <Button variant="contained" onClick={() => onChoose(null)}>
              {t("create.randomClass", "Random")}
            </Button>
            {classes.map((characterClass) => (
              <ButtonBase
                key={characterClass.id}
                onClick={() => onChoose(characterClass.id)}
                sx={{
                  display: "block",
                  p: 1.5,
                  textAlign: "left",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography component="span" display="block" fontWeight={700}>
                  {characterClass.name}
                </Typography>
                {characterClass.description && (
                  <Typography component="span" display="block" variant="body2">
                    {characterClass.description}
                  </Typography>
                )}
              </ButtonBase>
            ))}
          </Stack>
        )}
      </DialogContent>
    </Popover>
  );
}
