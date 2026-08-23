import MiseryMarks from "@/components/molecules/character/MiseryMarks";
import { useTranslation } from "react-i18next";
import {
  MiseryHeaderAnchor,
  MiseryHeaderLabel,
} from "./MiseryHeaderLink.styled";
import { normalizeMiseryCount } from "./miseryTrackUtils";

export default function MiseryHeaderLink({
  count,
}: {
  count: number | undefined;
}) {
  const { t } = useTranslation();
  const normalizedCount = normalizeMiseryCount(count);

  return (
    <MiseryHeaderAnchor
      href="#miseries"
      data-testid="header-misery-mirror"
      aria-label={t("miseries.headerAria", { count: normalizedCount })}
    >
      <MiseryHeaderLabel>{t("miseries.headerLabel")}</MiseryHeaderLabel>
      <MiseryMarks count={normalizedCount} compact />
    </MiseryHeaderAnchor>
  );
}
