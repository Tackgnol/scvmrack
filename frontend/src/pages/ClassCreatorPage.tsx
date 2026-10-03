import { ClassCreator } from "@/components/organisms/class-creator/ClassCreator/ClassCreator";
import { SavedClassCreator } from "@/components/organisms/class-creator/SavedClassCreator/SavedClassCreator";
import { blankDraft } from "@/components/organisms/class-creator/classCreator.utils";
import { useAuth } from "@/hooks/useAuth";
import { CenterRow, Page, Spinner, Stamp, Title } from "@/pages/gmPages.styles";
import { Seo } from "@/seo/Seo";
import { Alert } from "@mui/material";
import { useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

/** `/gm/classes/new` forges a class from blank; `/gm/classes/$classId` edits one of the GM's own. */
export function ClassCreatorPage() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  const { classId } = useParams({ strict: false }) as { classId?: string };
  const id = classId ? Number(classId) : null;

  return (
    <>
      <Seo
        title="Forge a class"
        description="The class creator."
        path={id === null ? "/gm/classes/new" : `/gm/classes/${id}`}
        noIndex
      />
      <Page>
        <Stamp>{t("gm.stamp", "Game Master")}</Stamp>
        <Title component="h1">
          {id === null ? t("creator.titleNew", "Forge a class") : t("creator.titleEdit", "Edit a class")}
        </Title>
        {isLoading && (
          <CenterRow>
            <Spinner />
          </CenterRow>
        )}
        {!isLoading && !isAuthenticated && (
          <Alert severity="warning">{t("classes.loginRequired", "You need to be logged in to forge classes.")}</Alert>
        )}
        {isAuthenticated && id === null && <ClassCreator classId={null} initialDraft={blankDraft()} />}
        {isAuthenticated && id !== null && <SavedClassCreator classId={id} />}
      </Page>
    </>
  );
}
