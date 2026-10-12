import {
  classKeys,
  deleteClassDraft,
  disputeClassDecision,
  listClassDrafts,
  listMyClasses,
  publishClass,
  removeClass,
  restoreClass,
  unpublishClass,
  type ClassLanguage,
} from "@/api/classes";
import MorkBorgModal, { ModalButton } from "@/components/molecules/modal/MorkBorgModal";
import { useAuth } from "@/hooks/useAuth";
import { getApiLocale } from "@/hooks/utils";
import {
  Card,
  CardAction,
  CardGrid,
  CardName,
  CenterRow,
  EmptyText,
  Meta,
  Page,
  Spinner,
  Stamp,
  Title,
} from "@/pages/gmPages.styles";
import { Seo } from "@/seo/Seo";
import { getUserFacingApiErrorMessage } from "@/utils/errorUtils";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Typography,
  TextField,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { ClassDescription, TakenDownNotice, ZineLine } from "./ClassesPage.styles";

function draftName(
  draft: { name: { en: string; pl: string } },
  locale: ClassLanguage,
) {
  return (
    draft.name[locale] || draft.name.en || draft.name.pl || "Untitled class"
  );
}

function expiryDays(updatedAt: string) {
  return Math.max(
    0,
    Math.ceil(90 - (Date.now() - new Date(updatedAt).getTime()) / 86_400_000),
  );
}

/** The GM's own Custom Classes, newest first, with the way into the creator. */
export function ClassesPage() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  const signedOut = !isLoading && !isAuthenticated;
  const locale = getApiLocale<ClassLanguage>(i18n.language);
  const [publishTarget, setPublishTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [publishConfirmed, setPublishConfirmed] = useState(false);
  const [disputeTarget, setDisputeTarget] = useState<number | null>(null);
  const [removalTarget, setRemovalTarget] = useState<{ kind: "draft" | "class"; id: number; name: string } | null>(null);
  const [disputeText, setDisputeText] = useState("");
  const queryClient = useQueryClient();
  const draftsQuery = useQuery({
    queryKey: classKeys.drafts(),
    queryFn: listClassDrafts,
    enabled: isAuthenticated,
  });
  const discardDraft = useMutation({
    mutationFn: deleteClassDraft,
    onSuccess: () => {
      setRemovalTarget(null);
      void queryClient.invalidateQueries({ queryKey: classKeys.drafts() });
    },
  });
  const dispute = useMutation({ mutationFn: disputeClassDecision, onSuccess: () => { setDisputeTarget(null); setDisputeText(""); } });
  const remove = useMutation({
    mutationFn: removeClass,
    onSuccess: () => {
      setRemovalTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
  const restore = useMutation({
    mutationFn: restoreClass,
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["classes"] }),
  });
  const publish = useMutation({
    mutationFn: publishClass,
    onSuccess: () => {
      setPublishTarget(null);
      setPublishConfirmed(false);
      void queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
  const unpublish = useMutation({
    mutationFn: unpublishClass,
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["classes"] }),
  });
  const classesQuery = useQuery({
    queryKey: classKeys.mine(locale),
    queryFn: () => listMyClasses(locale),
    enabled: isAuthenticated,
  });

  return (
    <>
      <Seo
        title="My classes"
        description="Your Custom Classes."
        path="/gm/classes"
        noIndex
      />
      <Page>
        <Stamp>{t("classes.stamp", "Game Master · Classes")}</Stamp>
        <Title component="h1">{t("classes.title", "My classes")}</Title>

        {signedOut ? (
          <Alert severity="warning">
            {t(
              "classes.loginRequired",
              "You need to be logged in to forge classes.",
            )}
          </Alert>
        ) : (
          <Box>
            <CardAction component={Link} to="/gm/classes/new">
              {t("classes.forge", "Forge a class")}
            </CardAction>
          </Box>
        )}

        {classesQuery.isLoading && (
          <CenterRow>
            <Spinner />
          </CenterRow>
        )}
        {classesQuery.error && (
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => classesQuery.refetch()}
              >
                {t("actions.retry", "Retry")}
              </Button>
            }
          >
            {getUserFacingApiErrorMessage(
              classesQuery.error,
              t,
              "Your classes failed to load.",
            )}
          </Alert>
        )}
        {classesQuery.data?.length === 0 && draftsQuery.data?.length === 0 && (
          <EmptyText>
            {t(
              "classes.empty",
              "No classes yet. Forge one, then switch it on in a party's pool.",
            )}
          </EmptyText>
        )}

        <CardGrid>
          {(draftsQuery.data ?? []).map((draft) => {
            const days = expiryDays(draft.updatedAt);
            const name = draftName(draft.draft, locale);
            return (
              <Card key={`draft-${draft.id}`} data-testid="class-draft">
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
                    <Meta className="warn">
                      {t("classes.expiresIn", "Expires in {{count}} days", {
                        count: days,
                      })}
                    </Meta>
                  )}
                </Box>
                <Box>
                  <CardAction
                    component={Link}
                    to={`/gm/classes/draft/${draft.id}`}
                  >
                    {t("classes.resume", "Resume")}
                  </CardAction>
                  <ModalButton
                    variant="danger"
                    disabled={discardDraft.isPending}
                    style={{ marginLeft: 12 }}
                    onClick={() => setRemovalTarget({ kind: "draft", id: draft.id, name })}
                  >
                    {t("classes.discard", "Discard")}
                  </ModalButton>
                </Box>
              </Card>
            );
          })}
          {(classesQuery.data ?? []).map((cls) => (
            <Card key={cls.id} data-testid="own-class">
              <Box>
                <CardName>{cls.name}</CardName>
                {cls.description && (
                  <ClassDescription>{cls.description}</ClassDescription>
                )}
                {cls.takenDownAt && (
                  <TakenDownNotice>
                    <strong>{t("classes.takenDown", "Taken down")}</strong>
                    {t(
                      "classes.moderationTakenDown",
                      "This class was taken down by moderation.",
                    )}
                    {cls.takedownReason && ` ${cls.takedownReason}`}
                  </TakenDownNotice>
                )}
                <Meta>
                  {[
                    cls.languages
                      .map((l) => t(`classes.languages.${l}`))
                      .join(" + "),
                    cls.takenDownAt
                      ? t("classes.takenDown", "Taken down")
                      : t(`classes.visibility.${cls.visibility}`),
                    t("classes.origins", "{{count}} origins", {
                      count: cls.originCount,
                    }),
                    cls.status === "archived"
                      ? t("classes.archived", "Archived")
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </Meta>
              </Box>
              {cls.status === "archived" ? (
                <Button
                  color="inherit"
                  size="small"
                  disabled={restore.isPending}
                  onClick={() => restore.mutate(cls.id)}
                >
                  {t("classes.restore", "Restore")}
                </Button>
              ) : (
                <Box>
                  {cls.takenDownAt && (
                    <CardAction onClick={() => setDisputeTarget(cls.id)}>
                      {t("classes.appeal", "Appeal this decision")}
                    </CardAction>
                  )}
                  {!cls.takenDownAt && (
                    <CardAction
                      component={Link}
                      to={`/gm/classes/${cls.id}`}
                      aria-label={t("classes.editLabel", "Edit {{name}}", { name: cls.name })}
                    >
                      {t("classes.edit", "Edit")}
                    </CardAction>
                  )}
                  {cls.takenDownAt ? null : cls.visibility === "private" ? (
                    <CardAction
                      className="secondary"
                      disabled={publish.isPending}
                      onClick={() => {
                        setPublishTarget({ id: cls.id, name: cls.name });
                        setPublishConfirmed(false);
                      }}
                    >
                      {t("classes.publish", "Publish")}
                    </CardAction>
                  ) : (
                    <CardAction
                      className="secondary"
                      disabled={unpublish.isPending}
                      onClick={() => unpublish.mutate(cls.id)}
                    >
                      {t("classes.unpublish", "Unpublish")}
                    </CardAction>
                  )}
                  {!cls.takenDownAt && (
                    <ModalButton
                      variant="danger"
                      disabled={remove.isPending}
                      style={{ marginLeft: 12 }}
                      onClick={() => setRemovalTarget({ kind: "class", id: cls.id, name: cls.name })}
                    >
                      {t("classes.remove", "Remove")}
                    </ModalButton>
                  )}
                </Box>
              )}
            </Card>
          ))}
        </CardGrid>

        <ZineLine>
          <Trans
            i18nKey="creator.zineContact"
            components={{
              mail: (
                <a href="mailto:contact@rpgtools.co">contact@rpgtools.co</a>
              ),
            }}
          />
        </ZineLine>
        <MorkBorgModal
          role="alertdialog"
          open={removalTarget !== null}
          onClose={() => setRemovalTarget(null)}
          title={removalTarget?.kind === "draft"
            ? t("classes.discardConfirm", "Discard this unfinished draft?")
            : t("classes.removeConfirm", "Remove this class?")}
          maxWidth="xs"
          actions={
            <>
              <ModalButton variant="secondary" onClick={() => setRemovalTarget(null)}>
                {t("actions.cancel", "Cancel")}
              </ModalButton>
              <ModalButton
                variant="danger"
                disabled={discardDraft.isPending || remove.isPending}
                onClick={() => {
                  if (!removalTarget) return;
                  if (removalTarget.kind === "draft") discardDraft.mutate(removalTarget.id);
                  else remove.mutate(removalTarget.id);
                }}
              >
                {removalTarget?.kind === "draft"
                  ? t("classes.discard", "Discard")
                  : t("classes.remove", "Remove")}
              </ModalButton>
            </>
          }
        >
          <Typography>
            {removalTarget?.kind === "draft"
              ? t("classes.discardLoss", "“{{name}}” will be permanently deleted.", { name: removalTarget.name })
              : t("classes.removeLoss", "“{{name}}” will be deleted if unused. If scvm still use it, it will be archived and their rules will stay intact.", { name: removalTarget?.name ?? "" })}
          </Typography>
        </MorkBorgModal>
        <MorkBorgModal
          open={disputeTarget !== null}
          onClose={() => setDisputeTarget(null)}
          title={t("classes.disputeTitle", "Dispute this decision")}
          maxWidth="xs"
          actions={<ModalButton variant="primary" disabled={!disputeText.trim() || dispute.isPending} onClick={() => disputeTarget && dispute.mutate({ id: disputeTarget, text: disputeText })}>{t("classes.submitDispute", "Send dispute")}</ModalButton>}
        >
          <TextField autoFocus fullWidth label={t("classes.disputeText", "Why should we review this decision?")} multiline minRows={4} value={disputeText} onChange={(event) => setDisputeText(event.target.value)} inputProps={{ maxLength: 4000 }} />
          <Typography variant="body2">
            {t("classes.appealEmail", "Or email your appeal to")} {" "}
            <a href={`mailto:scvmrack-appeal@rpgtools.co?subject=Appeal%20class%20${disputeTarget ?? ""}`}>
              {t("classes.appealEmailLink", "Appeal by email")}
            </a>
          </Typography>
        </MorkBorgModal>
        <MorkBorgModal
          open={publishTarget !== null}
          onClose={() => setPublishTarget(null)}
          title={t("classes.publishTitle", "Publish this class?")}
          maxWidth="xs"
          actions={
            <>
              <ModalButton
                variant="secondary"
                onClick={() => setPublishTarget(null)}
              >
                {t("actions.cancel", "Cancel")}
              </ModalButton>
              <ModalButton
                variant="primary"
                disabled={!publishConfirmed || publish.isPending}
                onClick={() =>
                  publishTarget && publish.mutate(publishTarget.id)
                }
              >
                {publish.isPending
                  ? t("classes.publishing", "Publishing...")
                  : t("classes.publish", "Publish")}
              </ModalButton>
            </>
          }
        >
          <Typography>
            {t(
              "classes.publishImmediate",
              "“{{name}}” will be public immediately and other GMs can add it to their party pools.",
              { name: publishTarget?.name ?? "" },
            )}
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={publishConfirmed}
                onChange={(event) => setPublishConfirmed(event.target.checked)}
              />
            }
            label={
              <>
                {t(
                  "classes.publishRights",
                  "I made this class or have the right to share it.",
                )}{" "}
                <Link to="/terms" hash="publishing">{t("footer.terms", "Terms")}</Link>
              </>
            }
          />
        </MorkBorgModal>
      </Page>
    </>
  );
}
