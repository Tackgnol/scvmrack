import { getClassDetail, classKeys, type Localized } from '@/api/classes';
import { CenterRow, Lede, Spinner, Stamp, Title } from '@/pages/gmPages.styles';
import { Seo } from '@/seo/Seo';
import { Box, Container, Divider, Paper, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ReportLink, SectionHeading, Sheet } from './ClassDetailPage.styles';

function localized(value: Localized, language: 'en' | 'pl', authored: 'en' | 'pl') {
  return value[language].trim() || value[authored].trim();
}

/** Public read-only view of a published Custom Class. */
export function ClassDetailPage() {
  const { classId } = useParams({ from: '/classes/$classId' });
  const { t, i18n } = useTranslation();
  const language = i18n.language.startsWith('pl') ? 'pl' : 'en';
  const query = useQuery({
    queryKey: classKeys.detail(Number(classId)),
    queryFn: () => getClassDetail(Number(classId)),
  });

  if (query.isLoading) {
    return <CenterRow><Spinner /></CenterRow>;
  }
  if (!query.data) {
    const status = (query.error as { status?: number } | null)?.status;
    const failed = query.isError && (status === undefined || status >= 500);
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Lede role={failed ? 'alert' : undefined}>
          {failed
            ? t('classDetail.loadFailed', "This class wouldn't load. Try again in a moment.")
            : t('classDetail.notFound', 'Class not found.')}
        </Lede>
      </Container>
    );
  }

  const { draft, attribution } = query.data;
  const authored = draft.languages[0];
  const text = (value: Localized) => localized(value, language, authored);

  return (
    <>
      <Seo title={text(draft.name)} description={text(draft.description)} path={`/classes/${classId}`} />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Sheet>
          <Stack spacing={3}>
            <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
              <Stamp>{attribution}</Stamp>
              <Title component="h1">{text(draft.name)}</Title>
              <Lede>{text(draft.description)}</Lede>
              {/* styled() drops the router's route typing; /report reads classId loosely */}
              {query.data.reportable && (
                <ReportLink to="/report" search={{ classId } as never}>
                  {t('report.thisClass', 'Report this class')}
                </ReportLink>
              )}
            </Stack>
            <Divider />
            <Box>
              <SectionHeading>{t('creator.steps.origins.label')}</SectionHeading>
              <ol>
                {draft.origins.map((origin) => <li key={origin.key ?? text(origin)}>{text(origin)}</li>)}
              </ol>
            </Box>
            <Stack spacing={1.5}>
              <SectionHeading>{t('creator.steps.abilities.label')}</SectionHeading>
              {draft.abilities.map((ability) => (
                <Paper key={ability.key ?? text(ability.name)} sx={{ p: 2 }}>
                  <Typography component="h3" variant="h6">{text(ability.name)}</Typography>
                  <Typography>{text(ability.text)}</Typography>
                  {ability.table && (
                    <ol>
                      {ability.table.rows.map((row) => <li key={row.itemRef ?? text(row.text)}>{text(row.text)}</li>)}
                    </ol>
                  )}
                </Paper>
              ))}
            </Stack>
            {draft.items.length > 0 && (
              <Stack spacing={1}>
                <SectionHeading>{t('creator.steps.items.label')}</SectionHeading>
                {draft.items.map((item) => (
                  <Paper key={item.ref} sx={{ p: 2 }}>
                    <strong>{text(item.name)}</strong>
                    <Typography>{text(item.description)}</Typography>
                  </Paper>
                ))}
              </Stack>
            )}
            <Box>
              <SectionHeading>{t('creator.steps.gettingBetter.label')}</SectionHeading>
              <Lede sx={{ mt: 1 }}>{t(`classPool.rules.${draft.gettingBetterRule}`)}</Lede>
              {text(draft.gettingBetterNote) && <Lede sx={{ mt: 1 }}>{text(draft.gettingBetterNote)}</Lede>}
            </Box>
          </Stack>
        </Sheet>
      </Container>
    </>
  );
}
