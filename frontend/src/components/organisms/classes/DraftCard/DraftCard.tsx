import { ModalButton } from "@/components/molecules/modal/MorkBorgModal";
import { Card, CardAction, CardName, Meta } from "@/pages/gmPages.styles";
import { localizedText } from "@/utils/localizedText";
import { Box } from "@mui/material";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { DraftCardProps } from "./DraftCard.models";
import { expiryDays } from "./DraftCard.utils";

/** One unfinished creator draft on My classes, with how long it keeps and the way back into it. */
export function DraftCard({ draft, locale, locked, onDiscard }: DraftCardProps) {
  const { t } = useTranslation();
  const days = expiryDays(draft.expiresAt);
  const name = localizedText(draft.draft.name, locale) || t("classes.untitled", "Untitled class");

  return (
    <Card data-testid="class-draft">
      <Box>
        <CardName>{name}</CardName>
        <Meta>
          {draft.classId === null
            ? t("classes.draft", "Unfinished draft")
            : t("classes.unsavedEdits", "Unsaved edits to a saved class")}{" "}
          ·{" "}
          {t("classes.lastEdited", "Last edited {{date}}", {
            date: new Date(draft.updatedAt).toLocaleDateString(),
          })}
        </Meta>
        {days < 14 && (
          <Meta className="warn">{t("classes.expiresIn", "Expires in {{count}} days", { count: days })}</Meta>
        )}
      </Box>
      <Box>
        {!locked && (
          <CardAction component={Link} to={`/gm/classes/draft/${draft.id}`}>
            {t("classes.resume", "Resume")}
          </CardAction>
        )}
        <ModalButton variant="danger" style={{ marginLeft: 12 }} onClick={() => onDiscard(name)}>
          {t("classes.discard", "Discard")}
        </ModalButton>
      </Box>
    </Card>
  );
}
