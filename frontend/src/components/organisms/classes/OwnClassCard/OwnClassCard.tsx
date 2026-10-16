import { ModalButton } from "@/components/molecules/modal/MorkBorgModal";
import { Card, CardAction, CardName, Meta } from "@/pages/gmPages.styles";
import { Box, Button } from "@mui/material";
import { Link, type RegisteredRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { OwnClassCardProps } from "./OwnClassCard.models";
import { ClassDescription, TakenDownNotice } from "./OwnClassCard.styles";

/** One of the GM's own Custom Classes on My classes, with what can be done to it in its state. */
export function OwnClassCard({ cls, busy, onRestore, onAppeal, onPublish, onUnpublish, onRemove }: OwnClassCardProps) {
  const { t } = useTranslation();
  const takenDown = cls.takenDownAt !== null;

  return (
    <Card data-testid="own-class">
      <Box>
        <CardName>{cls.name}</CardName>
        {cls.description && <ClassDescription>{cls.description}</ClassDescription>}
        {takenDown && (
          <TakenDownNotice>
            <strong>{t("classes.takenDown", "Taken down")}</strong>
            {t("classes.moderationTakenDown", "This class was taken down by moderation.")}
            {cls.takedownReason && ` ${cls.takedownReason}`}{" "}
            <Link to="/terms" hash="moderation">
              {t("classes.moderationTerms", "How moderation works")}
            </Link>
          </TakenDownNotice>
        )}
        <Meta>
          {[
            cls.languages.map((l) => t(`classes.languages.${l}`)).join(" + "),
            takenDown ? t("classes.takenDown", "Taken down") : t(`classes.visibility.${cls.visibility}`),
            t("classes.origins", "{{count}} origins", { count: cls.originCount }),
            cls.status === "archived" ? t("classes.archived", "Archived") : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </Meta>
      </Box>
      {cls.status === "archived" ? (
        <Button color="inherit" size="small" disabled={busy} onClick={onRestore}>
          {t("classes.restore", "Restore")}
        </Button>
      ) : takenDown ? (
        <Box>
          <CardAction onClick={onAppeal}>{t("classes.appeal", "Appeal this decision")}</CardAction>
        </Box>
      ) : (
        <Box>
          <CardAction
            component={Link<RegisteredRouter, string, '/gm/classes/$classId'>}
            to="/gm/classes/$classId" params={{ classId: String(cls.id) }}
            aria-label={t("classes.editLabel", "Edit {{name}}", { name: cls.name })}
          >
            {t("classes.edit", "Edit")}
          </CardAction>
          <CardAction
            className="secondary"
            disabled={busy}
            onClick={cls.visibility === "private" ? onPublish : onUnpublish}
          >
            {cls.visibility === "private" ? t("classes.publish", "Publish") : t("classes.unpublish", "Unpublish")}
          </CardAction>
          <ModalButton variant="danger" disabled={busy} style={{ marginLeft: 12 }} onClick={onRemove}>
            {t("classes.remove", "Remove")}
          </ModalButton>
        </Box>
      )}
    </Card>
  );
}
