import FeedbackDialog, {
  type FeedbackContext,
} from '@/components/molecules/feedback/FeedbackDialog';
import { useSnackbar } from '@/SnackbarContext/SnackbarProvider';
import {
  getApiErrorCode,
  getApiErrorStatus,
  getApiRequestId,
  isUnexpectedApiError,
} from '@/utils/errorUtils';
import {
  createContext,
  type ReactNode,
  use,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';

type UnexpectedErrorReport = {
  id: number;
  kind: 'error';
  error: unknown;
  context?: FeedbackContext;
};

type ManualBugReport = {
  id: number;
  kind: 'bug';
  context?: FeedbackContext;
  source: string;
};

type ActiveReport = UnexpectedErrorReport | ManualBugReport;

type ErrorFeedbackContextValue = {
  showUnexpectedError: (error: unknown, context?: FeedbackContext) => boolean;
  showBugReport: (context?: FeedbackContext) => void;
  canReportUnexpectedError: boolean;
};

const ErrorFeedbackContext = createContext<ErrorFeedbackContextValue | null>(
  null
);

export function ErrorFeedbackProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { showSuccess } = useSnackbar();
  const [activeReport, setActiveReport] = useState<ActiveReport | null>(null);
  const nextReportIdRef = useRef(0);

  const showUnexpectedError = (error: unknown, context?: FeedbackContext) => {
    if (!isUnexpectedApiError(error)) {
      return false;
    }

    nextReportIdRef.current += 1;
    setActiveReport({
      id: nextReportIdRef.current,
      kind: 'error',
      error,
      context: {
        ...context,
        status: context?.status ?? getApiErrorStatus(error),
        code: context?.code ?? getApiErrorCode(error),
        requestId: context?.requestId ?? getApiRequestId(error),
      },
    });

    return true;
  };

  const showBugReport = (context?: FeedbackContext) => {
    nextReportIdRef.current += 1;
    const source =
      typeof context?.source === 'string' ? context.source : 'bug_report';

    setActiveReport({
      id: nextReportIdRef.current,
      kind: 'bug',
      source,
      context: {
        ...context,
        source,
      },
    });
  };

  const value = {
    showUnexpectedError,
    showBugReport,
    canReportUnexpectedError: true,
  };

  const isBugReport = activeReport?.kind === 'bug';

  return (
    <ErrorFeedbackContext.Provider value={value}>
      {children}
      <FeedbackDialog
        key={
          activeReport ? `${activeReport.kind}-${activeReport.id}` : 'idle'
        }
        open={!!activeReport}
        kind={isBugReport ? 'feedback' : 'error'}
        error={activeReport?.kind === 'error' ? activeReport.error : undefined}
        context={activeReport?.context}
        source={activeReport?.kind === 'bug' ? activeReport.source : undefined}
        title={isBugReport ? t('feedback.bugTitle', 'Report a bug') : undefined}
        description={
          isBugReport
            ? t(
                'feedback.bugDescription',
                'Describe what broke and what you expected. We will include the current page URL with the report.'
              )
            : undefined
        }
        promptLabel={
          isBugReport
            ? t('feedback.bugPrompt', 'What went wrong?')
            : undefined
        }
        submitLabel={
          isBugReport
            ? t('feedback.sendBugReport', 'Send bug report')
            : undefined
        }
        skipLabel={isBugReport ? t('common.cancel', 'Cancel') : undefined}
        onClose={() => setActiveReport(null)}
        onSubmitted={() => {
          showSuccess(
            isBugReport
              ? t('feedback.bugSent', 'Bug report sent.')
              : t('feedback.sent', 'Report sent.')
          );
        }}
      />
    </ErrorFeedbackContext.Provider>
  );
}

export function useErrorFeedback(): ErrorFeedbackContextValue {
  return (
    use(ErrorFeedbackContext) ?? {
      showUnexpectedError: () => false,
      showBugReport: () => {},
      canReportUnexpectedError: false,
    }
  );
}
