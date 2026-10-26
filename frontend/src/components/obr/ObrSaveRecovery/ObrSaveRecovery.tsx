import { ObrSignInCode } from "@/components/molecules/ObrSignInCode/ObrSignInCode";
import { Alert, Button } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCharacter } from "@/CharacterContext/CharacterContext";
import { useObrSession } from "@/obr/useObrSession";

export function ObrSaveRecovery() {
  const { isSessionExpired, saveFailed, retrySave } = useCharacter();
  const { signIn, cancelSignIn, signInProgress } = useObrSession();
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function recover() {
    setBusy(true);
    setFailed(false);
    try {
      if (isSessionExpired) {
        await signIn();
      }
      retrySave();
    } catch {
      setFailed(true);
    }
    setBusy(false);
  }

  if (!isSessionExpired && !saveFailed) {
    return null;
  }
  return (
    <Alert
      severity="warning"
      action={
        <Button color="inherit" disabled={busy} onClick={() => void recover()}>
          {t(isSessionExpired ? "errors.signInAgain" : "actions.retry")}
        </Button>
      }
    >
      {failed
        ? t("obr.player.signInFailed")
        : t(isSessionExpired ? "errors.unauthorized" : "status.unsavedRetry")}
      <ObrSignInCode
        code={signInProgress?.code}
        onCancel={cancelSignIn}
      />
    </Alert>
  );
}
