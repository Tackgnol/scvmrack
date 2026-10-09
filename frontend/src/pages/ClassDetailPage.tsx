import { getClassDetail, classKeys, type Localized } from '@/api/classes';
import { Box, Button, CircularProgress, Container, Divider, Paper, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
function localized(value: Localized, language: 'en' | 'pl', authored: 'en' | 'pl') { return value[language].trim() || value[authored].trim(); }
export function ClassDetailPage() {
  const { classId } = useParams({ from: '/classes/$classId' }); const { t, i18n } = useTranslation(); const language = i18n.language.startsWith('pl') ? 'pl' : 'en';
  const query = useQuery({ queryKey: classKeys.detail(Number(classId)), queryFn: () => getClassDetail(Number(classId)) });
  if (query.isLoading) return <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 240 }}><CircularProgress /></Box>;
  if (!query.data) return <Container maxWidth="md"><Typography>Class not found.</Typography></Container>;
  const { draft, attribution } = query.data; const authored = draft.languages[0]; const text = (value: Localized) => localized(value, language, authored);
  return <Container maxWidth="md" sx={{ py: 4 }}><Stack spacing={3}>
    <Box><Typography variant="h3">{text(draft.name)}</Typography><Typography variant="caption">{attribution}</Typography><Typography sx={{ mt: 1 }}>{text(draft.description)}</Typography>{query.data.reportable && <Button component="a" href={`/report?classId=${classId}`} size="small" sx={{ mt: 2 }}>{t('report.link', 'Report a class')}</Button>}</Box><Divider />
    <Box><Typography variant="h5">Origins</Typography><ol>{draft.origins.map((origin) => <li key={origin.key ?? text(origin)}>{text(origin)}</li>)}</ol></Box>
    <Box><Typography variant="h5">Abilities</Typography><Stack spacing={2}>{draft.abilities.map((ability) => <Paper key={ability.key ?? text(ability.name)} sx={{ p: 2 }}><Typography variant="h6">{text(ability.name)}</Typography><Typography>{text(ability.text)}</Typography>{ability.table && <ol>{ability.table.rows.map((row) => <li key={row.itemRef ?? text(row.text)}>{text(row.text)}</li>)}</ol>}</Paper>)}</Stack></Box>
    <Box><Typography variant="h5">Class Items</Typography><Stack spacing={1}>{draft.items.map((item) => <Paper key={item.ref} sx={{ p: 2 }}><strong>{text(item.name)}</strong><Typography>{text(item.description)}</Typography></Paper>)}</Stack></Box>
    <Box><Typography variant="h5">Getting Better</Typography><Typography>{draft.gettingBetterRule.replace(/_/g, ' ')}</Typography>{text(draft.gettingBetterNote) && <Typography>{text(draft.gettingBetterNote)}</Typography>}</Box>
  </Stack></Container>;
}
