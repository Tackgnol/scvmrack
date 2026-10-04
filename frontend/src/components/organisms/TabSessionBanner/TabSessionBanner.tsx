import { Alert, Button } from "@mui/material";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { authHeaders, TAB_SESSION_KEY } from "@/utils/tabSession";
import "./TabSessionBanner.styles.css";

export function TabSessionBanner() {
  const { t } = useTranslation();
  const active = useSyncExternalStore(
    (onChange) => {
      window.addEventListener(TAB_SESSION_KEY, onChange);
      return () => window.removeEventListener(TAB_SESSION_KEY, onChange);
    },
    () => Boolean(authHeaders().Authorization),
    () => false,
  );
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  useEffect(() => {
    if (copyState !== "copied") return;
    const timer = window.setTimeout(() => setCopyState("idle"), 2000);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  if (!active) return null;

  return (
    <Alert severity="warning" className="tab-session-banner">
      {t("tabSession.warning")}
      <Button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(window.location.href);
            setCopyState("copied");
          } catch {
            setCopyState("failed");
          }
        }}
      >
        {t(
          copyState === "copied" ? "tabSession.copied" : "tabSession.copyLink",
        )}
      </Button>
      {copyState === "failed" && (
        <span role="status">{t("tabSession.copyFailed")}</span>
      )}
    </Alert>
  );
}
