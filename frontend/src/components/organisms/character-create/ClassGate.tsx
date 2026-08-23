import { useEffect, useState } from 'react';
import { Alert, Box, Button, ButtonBase, CircularProgress, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import * as Sentry from '@sentry/react';
import { fetchClasses, type ClassSummary } from '@/api/draft';
import type { StartChoice } from '@/hooks/useCharacterDraft';
import { classGateStyles as styles } from '@/theme/createStyles';
import d20Icon from '@/assets/D20.svg';
import {
  getApiErrorCode,
  getApiErrorStatus,
  getApiRequestId,
  shouldCaptureClientError,
} from '@/utils/errorUtils';

const CLASS_LOAD_TIMEOUT_MS = 10_000;

type ClassGateProps = {
  onPick: (choice: StartChoice) => void;
  busy: boolean;
};

type ClassLoadState =
  | { key: string; status: 'loaded'; classes: ClassSummary[] }
  | { key: string; status: 'failed' };

export function ClassGate({ onPick, busy }: ClassGateProps) {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language ?? 'en').split('-')[0];
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loadState, setLoadState] = useState<ClassLoadState | null>(null);
  const requestKey = `${locale}:${loadAttempt}`;
  const classes = loadState?.key === requestKey && loadState.status === 'loaded'
    ? loadState.classes
    : null;
  const loadFailed = loadState?.key === requestKey && loadState.status === 'failed';

  // Keyed on `locale` only — NOT `t`. The `t` from useTranslation changes identity
  // while i18n is still warming up on a cold first load; including it here re-ran the
  // effect and aborted the in-flight class fetch, leaving the spinner stuck forever
  // (it only worked after a refresh, once i18n was warm). The error copy is read at
  // render time instead, so the effect never depends on `t`.
  useEffect(() => {
    const controller = new AbortController();
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, CLASS_LOAD_TIMEOUT_MS);

    fetchClasses(locale, controller.signal)
      .then((result) => {
        setLoadState({ key: requestKey, status: 'loaded', classes: result });
      })
      .catch((e) => {
        if (e instanceof DOMException && e.name === 'AbortError' && !timedOut) return;

        const error = timedOut ? new Error('Class catalog request timed out') : e;
        setLoadState({ key: requestKey, status: 'failed' });
        if (shouldCaptureClientError(error)) {
          Sentry.captureException(error, {
            tags: {
              source: 'class_gate',
              operation: 'load_classes',
            },
            extra: {
              locale,
              status: getApiErrorStatus(e),
              code: getApiErrorCode(e),
              requestId: getApiRequestId(e),
              timedOut,
            },
          });
        }
      })
      .finally(() => {
        window.clearTimeout(timeout);
      });
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [locale, requestKey]);

  return (
    <Box sx={styles.root}>
      <Box component="section" sx={styles.intro}>
        <Typography component="span" sx={styles.kicker}>
          {t('create.classGateKicker', 'Character creation')}
        </Typography>
        <Typography component="h1" sx={styles.title}>
          {t('create.chooseClass', 'Choose your misery')}
        </Typography>
        <Typography sx={styles.hint}>
          {t('create.chooseClassHint', 'Pick a class, go classless, or let the dice decide.')}
        </Typography>
      </Box>

      {loadFailed && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {t('create.classLoadError', 'Failed to load classes')}
          <Button
            color="inherit"
            size="small"
            onClick={() => setLoadAttempt((attempt) => attempt + 1)}
            sx={{ ml: 1 }}
          >
            {t('common.retry', 'Retry')}
          </Button>
        </Alert>
      )}
      {!classes && !loadFailed && (
        <Box sx={styles.loading}>
          <CircularProgress color="inherit" />
        </Box>
      )}

      {classes && (
        <Box sx={styles.chooser}>
          <Box sx={styles.grid}>
            {classes.map((cls) => (
              <ButtonBase
                key={cls.id}
                data-testid={`class-gate-class-${cls.id}`}
                disabled={busy}
                onClick={() => onPick({ classId: cls.id })}
                sx={styles.card}
              >
                <Typography component="span" sx={styles.cardTitle}>{cls.name}</Typography>
                {cls.description && (
                  <Typography component="span" sx={styles.cardDescription}>
                    {cls.description}
                  </Typography>
                )}
              </ButtonBase>
            ))}
          </Box>
          <Box sx={styles.actions}>
            <ButtonBase
              data-testid="class-gate-random"
              disabled={busy}
              onClick={() => onPick({})}
              sx={{ ...styles.card, ...styles.specialCard, ...styles.random }}
            >
              <Box sx={styles.randomMark} data-testid="class-gate-random-mark" aria-hidden="true">
                <Box component="img" src={d20Icon} alt="" />
              </Box>
              <Typography component="span" sx={styles.specialTitle}>
                {t('create.randomClass', 'Random')}
              </Typography>
              <Typography component="span" sx={styles.specialDescription}>
                {t('create.randomClassHint', 'Let the dice choose the first wound.')}
              </Typography>
            </ButtonBase>
            <ButtonBase
              data-testid="class-gate-classless"
              disabled={busy}
              onClick={() => onPick({ classless: true })}
              sx={{ ...styles.card, ...styles.specialCard, ...styles.special }}
            >
              <Typography component="span" sx={styles.specialTitle}>
                {t('create.classless', 'Classless Scvm')}
              </Typography>
              <Typography component="span" sx={styles.specialDescription}>
                {t('create.classlessHint', 'No class. No abilities. Just you and the dark.')}
              </Typography>
            </ButtonBase>
          </Box>
        </Box>
      )}
    </Box>
  );
}
