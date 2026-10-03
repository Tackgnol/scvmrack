import { classKeys, listMyClasses, type ClassLanguage } from "@/api/classes";
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
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Trans, useTranslation } from "react-i18next";
import { ClassDescription, ZineLine } from "./ClassesPage.styles";

/** The GM's own Custom Classes, newest first, with the way into the creator. */
export function ClassesPage() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  const signedOut = !isLoading && !isAuthenticated;
  const locale = getApiLocale<ClassLanguage>(i18n.language);
  const classesQuery = useQuery({
    queryKey: classKeys.mine(locale),
    queryFn: () => listMyClasses(locale),
    enabled: isAuthenticated,
  });

  return (
    <>
      <Seo title="My classes" description="Your Custom Classes." path="/gm/classes" noIndex />
      <Page>
        <Stamp>{t("gm.stamp", "Game Master")}</Stamp>
        <Title component="h1">{t("classes.title", "My classes")}</Title>

        {signedOut ? (
          <Alert severity="warning">
            {t("classes.loginRequired", "You need to be logged in to forge classes.")}
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
              <Button color="inherit" size="small" onClick={() => classesQuery.refetch()}>
                {t("actions.retry", "Retry")}
              </Button>
            }
          >
            {getUserFacingApiErrorMessage(classesQuery.error, t, "Your classes failed to load.")}
          </Alert>
        )}
        {classesQuery.data?.length === 0 && (
          <EmptyText>
            {t("classes.empty", "No classes yet. Forge one, then switch it on in a party's pool.")}
          </EmptyText>
        )}

        <CardGrid>
          {(classesQuery.data ?? []).map((cls) => (
            <Card key={cls.id} data-testid="own-class">
              <Box>
                <CardName>{cls.name}</CardName>
                {cls.description && <ClassDescription>{cls.description}</ClassDescription>}
                <Meta>
                  {[
                    cls.languages.map((l) => t(`classes.languages.${l}`)).join(" + "),
                    t(`classes.visibility.${cls.visibility}`),
                    t("classes.origins", "{{count}} origins", { count: cls.originCount }),
                  ].join(" · ")}
                </Meta>
              </Box>
              <CardAction
                component={Link}
                to={`/gm/classes/${cls.id}`}
                aria-label={t("classes.editLabel", "Edit {{name}}", { name: cls.name })}
              >
                {t("classes.edit", "Edit")}
              </CardAction>
            </Card>
          ))}
        </CardGrid>

        <ZineLine>
          <Trans
            i18nKey="creator.zineContact"
            components={{ mail: <a href="mailto:contact@rpgtools.co">contact@rpgtools.co</a> }}
          />
        </ZineLine>
      </Page>
    </>
  );
}
