import { ClassCreator } from "@/components/organisms/class-creator/ClassCreator/ClassCreator";
import { SavedClassCreator } from "@/components/organisms/class-creator/SavedClassCreator/SavedClassCreator";
import { blankDraft } from "@/components/organisms/class-creator/classCreator.utils";
import { classKeys, getClassDraft, getMyCreationBan } from "@/api/classes";
import { useAuth } from "@/hooks/useAuth";
import { CenterRow, Page, Spinner, Stamp, Title } from "@/pages/gmPages.styles";
import { Seo } from "@/seo/Seo";
import { Alert } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

/** `/gm/classes/new` forges a class from blank; `/gm/classes/$classId` edits one of the GM's own. */
export function ClassCreatorPage() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  const { classId, draftId } = useParams({ strict: false }) as { classId?: string; draftId?: string };
  const id = classId ? Number(classId) : null;
  const draft = draftId ? Number(draftId) : null;
  const draftQuery = useQuery({
    queryKey: classKeys.draft(draft ?? 0),
    queryFn: () => getClassDraft(draft!),
    enabled: isAuthenticated && draft !== null,
  });
  const creationBan = useQuery({
    queryKey: classKeys.creationBan(),
    queryFn: getMyCreationBan,
    enabled: isAuthenticated && id === null,
  });
  const needsCreationPermission = id === null && (draft === null || draftQuery.data?.classId === null);
  const canCreate = !needsCreationPermission || (creationBan.isSuccess && !creationBan.data.banned);

  return (
    <>
      <Seo
        title="Forge a class"
        description="The class creator."
        path={draft !== null ? `/gm/classes/draft/${draft}` : id === null ? "/gm/classes/new" : `/gm/classes/${id}`}
        noIndex
      />
      <Page>
        <Stamp>{t("gm.stamp", "Game Master")}</Stamp>
        <Title component="h1">
          {draft !== null ? t("creator.titleResume", "Resume a class") : id === null ? t("creator.titleNew", "Forge a class") : t("creator.titleEdit", "Edit a class")}
        </Title>
        {isLoading && (
          <CenterRow>
            <Spinner />
          </CenterRow>
        )}
        {!isLoading && !isAuthenticated && (
          <Alert severity="warning">{t("classes.loginRequired", "You need to be logged in to forge classes.")}</Alert>
        )}
        {isAuthenticated && draft !== null && draftQuery.isLoading && (
          <CenterRow><Spinner /></CenterRow>
        )}
        {isAuthenticated && draft !== null && draftQuery.error && (
          <Alert severity="error">{t("creator.draftLoadFailed", "This draft wouldn't load.")}</Alert>
        )}
        {isAuthenticated && needsCreationPermission && creationBan.isLoading && (
          <CenterRow><Spinner /></CenterRow>
        )}
        {isAuthenticated && needsCreationPermission && creationBan.error && (
          <Alert severity="error">{t("creator.creationStatusFailed", "Class creation status couldn't load. Try again later.")}</Alert>
        )}
        {isAuthenticated && needsCreationPermission && creationBan.data?.banned && (
          <Alert severity="warning">{t("creator.creationBanned", "You cannot create new Custom Classes while a moderation restriction is active. Your existing classes remain available.")}</Alert>
        )}
        {isAuthenticated && draft !== null && draftQuery.data && canCreate && (
          <ClassCreator classId={draftQuery.data.classId} initialDraft={draftQuery.data.draft} initialDraftRecord={draftQuery.data} />
        )}
        {isAuthenticated && draft === null && id === null && canCreate && <ClassCreator classId={null} initialDraft={blankDraft()} />}
        {isAuthenticated && draft === null && id !== null && <SavedClassCreator classId={id} />}
      </Page>
    </>
  );
}
