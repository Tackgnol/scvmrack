import {
  classKeys,
  deleteClassDraft,
  listClassDrafts,
  listMyClasses,
  removeClass,
  restoreClass,
  type ClassLanguage,
} from "@/api/classes";
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
import { Alert, Box, Button } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Trans, useTranslation } from "react-i18next";
import { ClassDescription, ZineLine } from "./ClassesPage.styles";

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
  const queryClient = useQueryClient();
  const draftsQuery = useQuery({
    queryKey: classKeys.drafts(),
    queryFn: listClassDrafts,
    enabled: isAuthenticated,
  });
  const discardDraft = useMutation({
    mutationFn: deleteClassDraft,
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: classKeys.drafts() }),
  });
  const remove = useMutation({
    mutationFn: removeClass,
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["classes"] }),
  });
  const restore = useMutation({
    mutationFn: restoreClass,
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
        <Stamp>{t("gm.stamp", "Game Master")}</Stamp>
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
        {classesQuery.data?.length === 0 && (
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
                    {t("classes.draft", "Unfinished draft")} ·{" "}
                    {t("classes.lastEdited", "Last edited {{date}}", {
                      date: new Date(draft.updatedAt).toLocaleDateString(),
                    })}
                  </Meta>
                  {days < 14 && (
                    <Meta sx={{ color: "#ff4d7d" }}>
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
                  <Button
                    color="inherit"
                    size="small"
                    disabled={discardDraft.isPending}
                    onClick={() => {
                      if (
                        window.confirm(
                          t(
                            "classes.discardConfirm",
                            "Discard this unfinished draft?",
                          ),
                        )
                      )
                        discardDraft.mutate(draft.id);
                    }}
                  >
                    {t("classes.discard", "Discard")}
                  </Button>
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
                <Meta>
                  {[
                    cls.languages
                      .map((l) => t(`classes.languages.${l}`))
                      .join(" + "),
                    t(`classes.visibility.${cls.visibility}`),
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
              <CardAction
                component={Link}
                to={`/gm/classes/${cls.id}`}
                    aria-label={t("classes.editLabel", "Edit {{name}}", {
                      name: cls.name,
                    })}
              >
                {t("classes.edit", "Edit")}
              </CardAction>
                  <Button
                    color="inherit"
                    size="small"
                    disabled={remove.isPending}
                    onClick={() => {
                      if (
                        window.confirm(
                          t(
                            "classes.removeConfirm",
                            "Remove this class? Existing scvm will keep their rules; the class will be archived.",
                          ),
                        )
                      )
                        remove.mutate(cls.id);
                    }}
                  >
                    {t("classes.remove", "Remove")}
                  </Button>
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
      </Page>
    </>
  );
}
