import { getApiLocale } from "@/hooks/utils";
import { useRoomClasses } from "@/obr/useRoomClasses";
import { useTranslation } from "react-i18next";
import type { ObrRoomPoolSummaryProps } from "./ObrRoomPoolSummary.models";

/**
 * The classes an Owlbear room's party rolls from, read-only: only the party's owner can change
 * its pool, so a room party nobody has claimed shows what it offers and how to change it.
 */
export function ObrRoomPoolSummary({ roomId }: ObrRoomPoolSummaryProps) {
  const { t, i18n } = useTranslation();
  const locale = getApiLocale(i18n.language);
  const classes = useRoomClasses(roomId, locale);

  if (!classes.data) {
    return null;
  }
  const names = classes.data.classes.flatMap((cls) => cls.name ?? []);
  if (classes.data.classlessEnabled) {
    names.push(t('obr.common.classless', 'Classless'));
  }
  return (
    <p>
      {names.length > 0 ? t("obr.roster.roomPoolList", "Classes this room rolls: {{classes}}.", {
        classes: classes.data.classes.length === 0
          ? t("obr.roster.roomPoolClassless", "Classless only")
          : names.join(", "),
      }) : t('obr.roster.roomPoolEmpty', 'No scvm can be rolled in this room.')}{" "}
      {t("obr.roster.roomPoolReadOnly", "Only the party's owner can change them.")}
    </p>
  );
}
