import { useTranslation } from "react-i18next";
import type { ObrSignInCodeProps } from "./ObrSignInCode.models";
import { Button, Stack, Typography } from "@mui/material";

export function ObrSignInCode({ code, onCancel }: ObrSignInCodeProps) {
  const { t } = useTranslation();
  return code || onCancel ? (
    <Stack spacing={1} alignItems="flex-start">
      {code && (
        <>
          <Typography component="p" sx={{ fontWeight: 700 }}>
            {t("obr.auth.waitingHeading")}
          </Typography>
          <Typography component="p" variant="body2">
            {t("obr.auth.waitingHelp")}
          </Typography>
          <span role="status">{t("obr.auth.comparison", { code })}</span>
        </>
      )}
      {onCancel && (
        <Button color="inherit" onClick={onCancel}>
          {t("obr.auth.cancel")}
        </Button>
      )}
    </Stack>
  ) : null;
}
