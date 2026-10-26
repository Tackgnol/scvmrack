import { useTranslation } from "react-i18next";
import type { ObrSignInCodeProps } from "./ObrSignInCode.models";

export function ObrSignInCode({ code }: ObrSignInCodeProps) {
  const { t } = useTranslation();
  return code ? (
    <span role="status">{t("obr.auth.comparison", { code })}</span>
  ) : null;
}
