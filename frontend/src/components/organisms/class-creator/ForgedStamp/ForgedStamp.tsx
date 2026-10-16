import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { ForgedStampProps } from "./ForgedStamp.models";
import { Forged } from "./ForgedStamp.styles";

/** The FORGED stamp after a save, with the way to the GM's class list. */
export function ForgedStamp({ name }: ForgedStampProps) {
  const { t } = useTranslation();
  return (
    <Forged>
      <b>{t("creator.review.forged", "Forged")}</b>
      <span>
        {t("creator.review.forgedNote", "“{{name}}” is saved to your classes. Any edit here re-arms Save.", { name })}
      </span>
      <Link to="/gm/classes">
        {t("creator.review.goToClasses", "Go to my classes")}
        <ArrowForwardIcon aria-hidden="true" fontSize="small" />
      </Link>
    </Forged>
  );
}
