import { classKeys, listClassDrafts, listMyClasses, publishClass, restoreClass, unpublishClass } from "@/api/classes";
import { DisputeDialog } from "@/components/organisms/classes/DisputeDialog/DisputeDialog";
import { DraftCard } from "@/components/organisms/classes/DraftCard/DraftCard";
import { OwnClassCard } from "@/components/organisms/classes/OwnClassCard/OwnClassCard";
import { PublishDialog } from "@/components/organisms/classes/PublishDialog/PublishDialog";
import { RemovalDialog } from "@/components/organisms/classes/RemovalDialog/RemovalDialog";
import type { RemovalTarget } from "@/components/organisms/classes/RemovalDialog/RemovalDialog.models";
import { useAuth } from "@/hooks/useAuth";
import { getApiLocale } from "@/hooks/utils";
import { CardAction, CardGrid, CenterRow, EmptyText, Meta, Page, Spinner, Stamp, Title } from "@/pages/gmPages.styles";
import { useSnackbar } from "@/SnackbarContext/SnackbarProvider";
import { Seo } from "@/seo/Seo";
import { getUserFacingApiErrorMessage } from "@/utils/errorUtils";
import { Alert, Box, Button } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { ZineLine } from "./ClassesPage.styles";

// Mirrors the server's cap on unfinished new classes; the server refuses a fourth.
const NEW_DRAFT_LIMIT = 3;

/** The GM's own Custom Classes, newest first, with the way into the creator. */
export function ClassesPage() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  const signedOut = !isLoading && !isAuthenticated;
  const locale = getApiLocale(i18n.language);
  const queryClient = useQueryClient();
  const { showError } = useSnackbar();
  const [publishTarget, setPublishTarget] = useState<{ id: number; name: string } | null>(null);
  const [disputeTarget, setDisputeTarget] = useState<number | null>(null);
  const [removalTarget, setRemovalTarget] = useState<RemovalTarget | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const draftsQuery = useQuery({ queryKey: classKeys.drafts(), queryFn: listClassDrafts, enabled: isAuthenticated, refetchOnMount: "always" });
  const classesQuery = useQuery({
    queryKey: classKeys.mine(locale),
    queryFn: () => listMyClasses(locale),
    enabled: isAuthenticated,
    refetchOnMount: "always",
  });
  const refresh = () => void queryClient.invalidateQueries({ queryKey: classKeys.all() });
  const restore = useMutation({
    mutationFn: restoreClass,
    onSuccess: refresh,
    onError: (error) =>
      showError(getUserFacingApiErrorMessage(error, t, t("classes.restoreFailed", "The class wasn't restored. Try again."))),
  });
  // A class that was public before skips the first-publish confirmation.
  const republish = useMutation({
    mutationFn: publishClass,
    onSuccess: refresh,
    onError: (error) =>
      showError(getUserFacingApiErrorMessage(error, t, t("classes.publishFailed", "The class wasn't published. Try again."))),
  });
  const unpublish = useMutation({
    mutationFn: unpublishClass,
    onSuccess: refresh,
    onError: (error) =>
      showError(getUserFacingApiErrorMessage(error, t, t("classes.unpublishFailed", "The class is still public. Try again."))),
  });

  const classes = classesQuery.data ?? [];
  const drafts = draftsQuery.data ?? [];
  const newDraftCount = drafts.filter((draft) => draft.classId === null).length;
  const archivedCount = classes.filter((cls) => cls.status === "archived").length;
  /** Classes whose leftover drafts can only be discarded: archived or taken down. */
  const lockedClassIds = new Set(classes.filter((cls) => cls.status === "archived" || cls.takenDownAt).map((cls) => cls.id));
  const shownClasses = classes.filter((cls) => (cls.status === "archived") === showArchived);

  return (
    <>
      <Seo title={t("classes.title", "My classes")} description="Your Custom Classes." path="/gm/classes" noIndex />
      <Page>
        <Stamp>{t("classes.stamp", "Game Master · Classes")}</Stamp>
        <Title component="h1">{t("classes.title", "My classes")}</Title>

        {signedOut ? (
          <Alert severity="warning">{t("classes.loginRequired", "You need to be logged in to forge classes.")}</Alert>
        ) : (
          <Box>
            {newDraftCount >= NEW_DRAFT_LIMIT ? (
              <Meta className="warn">
                {t("classes.draftLimit", "You keep 3 unfinished new classes. Finish or discard one to forge another.")}
              </Meta>
            ) : (
              <CardAction component={Link} to="/gm/classes/new">
                {t("classes.forge", "Forge a class")}
              </CardAction>
            )}
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
              <Button color="inherit" size="small" onClick={() => classesQuery.refetch()}>
                {t("actions.retry", "Retry")}
              </Button>
            }
          >
            {getUserFacingApiErrorMessage(classesQuery.error, t, t("classes.loadFailed", "Your classes failed to load."))}
          </Alert>
        )}
        {classesQuery.data?.length === 0 && draftsQuery.data?.length === 0 && (
          <EmptyText>{t("classes.empty", "No classes yet. Forge one, then switch it on in a party's pool.")}</EmptyText>
        )}

        {archivedCount > 0 && (
          <Button color="inherit" size="small" aria-pressed={showArchived} onClick={() => setShowArchived((current) => !current)}>
            {showArchived
              ? t("classes.showActive", "Show active classes")
              : t("classes.showArchived", "Archived ({{count}})", { count: archivedCount })}
          </Button>
        )}
        <CardGrid>
          {drafts.map((draft) => (
            <DraftCard
              key={`draft-${draft.id}`}
              draft={draft}
              locale={locale}
              locked={lockedClassIds.has(draft.classId ?? -1)}
              onDiscard={(name) => setRemovalTarget({ kind: "draft", id: draft.id, name })}
            />
          ))}
          {shownClasses.map((cls) => (
            <OwnClassCard
              key={cls.id}
              cls={cls}
              busy={restore.isPending || unpublish.isPending || republish.isPending}
              onRestore={() => restore.mutate(cls.id)}
              onAppeal={() => setDisputeTarget(cls.id)}
              onPublish={() =>
                cls.everPublished ? republish.mutate(cls.id) : setPublishTarget({ id: cls.id, name: cls.name })
              }
              onUnpublish={() => unpublish.mutate(cls.id)}
              onRemove={() => setRemovalTarget({ kind: "class", id: cls.id, name: cls.name })}
            />
          ))}
        </CardGrid>

        <ZineLine>
          <Trans
            i18nKey="creator.zineContact"
            components={{ mail: <a href="mailto:contact@rpgtools.co">contact@rpgtools.co</a> }}
          />
        </ZineLine>
        <RemovalDialog target={removalTarget} onClose={() => setRemovalTarget(null)} />
        <DisputeDialog classId={disputeTarget} onClose={() => setDisputeTarget(null)} />
        <PublishDialog target={publishTarget} onClose={() => setPublishTarget(null)} />
      </Page>
    </>
  );
}
