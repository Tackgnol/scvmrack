import MorkBorgModal, { ModalButton } from '@/components/molecules/modal/MorkBorgModal';
import {
  sendFeedbackReport,
  serializeError,
} from '@/components/molecules/feedback/feedbackCapture';
import { trackEvent } from '@/analytics/googleAnalytics';
import {
  getApiErrorCode,
  getApiErrorStatus,
  getApiRequestId,
} from '@/utils/errorUtils';
import { customStyles } from '@/theme/morkBorgTheme';
import { Box, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export type FeedbackDialogKind = 'feedback' | 'error';

export type FeedbackContext = Record<
  string,
  string | number | boolean | null | undefined
>;

type FeedbackDialogProps = {
  open: boolean;
  kind?: FeedbackDialogKind;
  error?: unknown;
  context?: FeedbackContext;
  title?: string;
  description?: string;
  promptLabel?: string;
  submitLabel?: string;
  skipLabel?: string;
  source?: string;
  onClose: () => void;
  onSubmitted?: (eventId: string) => void;
};

type FeedbackFormState = {
  open: boolean;
  kind: FeedbackDialogKind;
  error: unknown;
  message: string;
  isSending: boolean;
};

function cleanedContext(context?: FeedbackContext): Record<string, unknown> {
  if (!context) return {};

  return Object.fromEntries(
    Object.entries(context).filter(([, value]) => value !== undefined)
  );
}

function feedbackTags(kind: FeedbackDialogKind, context?: FeedbackContext) {
  const cleaned = cleanedContext(context);
  return {
    feedback_kind: kind,
    feedback_source: String(cleaned.source ?? kind),
    ...(cleaned.status ? { http_status: String(cleaned.status) } : {}),
    ...(cleaned.code ? { api_code: String(cleaned.code) } : {}),
  };
}

export default function FeedbackDialog({
  open,
  kind = 'feedback',
  error,
  context,
  title,
  description,
  promptLabel,
  submitLabel,
  skipLabel,
  source,
  onClose,
  onSubmitted,
}: FeedbackDialogProps) {
  const { t } = useTranslation();
  const [formState, setFormState] = useState<FeedbackFormState>(() => ({
    open,
    kind,
    error,
    message: '',
    isSending: false,
  }));

  if (
    formState.open !== open ||
    formState.kind !== kind ||
    formState.error !== error
  ) {
    setFormState({
      open,
      kind,
      error,
      message: open ? '' : formState.message,
      isSending: open ? false : formState.isSending,
    });
  }

  const { message, isSending } = formState;

  const setMessage = (nextMessage: string) => {
    setFormState((previous) => ({
      ...previous,
      message: nextMessage,
    }));
  };

  const setIsSending = (nextIsSending: boolean) => {
    setFormState((previous) => ({
      ...previous,
      isSending: nextIsSending,
    }));
  };

  const enrichedContext: FeedbackContext = {
    ...context,
    status: context?.status ?? getApiErrorStatus(error),
    code: context?.code ?? getApiErrorCode(error),
    requestId: context?.requestId ?? getApiRequestId(error),
    url: context?.url ?? window.location.href,
  };

  const resolvedTitle =
    title ??
    (kind === 'error'
      ? t('feedback.errorTitle', 'Unexpected error occurred')
      : t('feedback.title', 'Send feedback'));

  const resolvedDescription =
    description ??
    (kind === 'error'
      ? t(
          'feedback.errorDescription',
          'Tell us what you were doing. We will attach the technical error details in the background.'
        )
      : t('feedback.description', 'Tell us what happened.'));

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);

    const contextPayload = cleanedContext(enrichedContext);
    const reportSource =
      source ?? (kind === 'error' ? 'unexpected_error_dialog' : 'feedback_form');

    try {
      const feedbackEventId = await sendFeedbackReport({
        kind,
        message: trimmed,
        source: reportSource,
        url: String(contextPayload.url ?? window.location.href),
        context: contextPayload,
        tags: feedbackTags(kind, enrichedContext),
        error: kind === 'error' ? serializeError(error) : undefined,
      });

      trackEvent('feedback_submitted', {
        kind,
        source: reportSource,
      });

      onSubmitted?.(feedbackEventId);
      onClose();
    } catch (submitError) {
      // Keep the dialog open so the user can retry; surface details for debugging.
      console.error('Failed to send feedback report', submitError);
      setIsSending(false);
    }
  };

  return (
    <MorkBorgModal
      open={open}
      onClose={onClose}
      title={resolvedTitle}
      closeOnBackdrop={false}
      maxWidth="sm"
      actions={
        <Stack sx={customStyles.feedbackDialog.actions}>
          <ModalButton variant="secondary" onClick={onClose}>
            {skipLabel ?? t('feedback.skip', 'Skip')}
          </ModalButton>
          <ModalButton
            variant="primary"
            onClick={handleSubmit}
            disabled={message.trim().length === 0 || isSending}
          >
            {isSending
              ? t('feedback.sending', 'Sending...')
              : submitLabel ?? t('feedback.sendReport', 'Send report')}
          </ModalButton>
        </Stack>
      }
    >
      <Box sx={customStyles.feedbackDialog.body}>
        <Typography sx={customStyles.feedbackDialog.description}>
          {resolvedDescription}
        </Typography>
        <TextField
          label={promptLabel ?? t('feedback.prompt', 'What were you doing?')}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          multiline
          minRows={4}
          fullWidth
          autoFocus
          inputProps={{ maxLength: 2000, 'data-testid': 'feedback-message' }}
          sx={customStyles.feedbackDialog.field}
        />
      </Box>
    </MorkBorgModal>
  );
}
