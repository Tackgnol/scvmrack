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
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';

type UnexpectedErrorReport = {
  id: number;
  error: unknown;
  context?: FeedbackContext;
};

type ErrorFeedbackContextValue = {
  showUnexpectedError: (error: unknown, context?: FeedbackContext) => boolean;
};

const ErrorFeedbackContext = createContext<ErrorFeedbackContextValue | null>(
  null
);

export function ErrorFeedbackProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { showSuccess } = useSnackbar();
  const [activeReport, setActiveReport] = useState<UnexpectedErrorReport | null>(
    null
  );
  const nextReportIdRef = useRef(0);

  const showUnexpectedError = useCallback(
    (error: unknown, context?: FeedbackContext) => {
      if (!isUnexpectedApiError(error)) {
        return false;
      }

      nextReportIdRef.current += 1;
      setActiveReport({
        id: nextReportIdRef.current,
        error,
        context: {
          ...context,
          status: context?.status ?? getApiErrorStatus(error),
          code: context?.code ?? getApiErrorCode(error),
          requestId: context?.requestId ?? getApiRequestId(error),
        },
      });

      return true;
    },
    []
  );

  const value = useMemo(
    () => ({ showUnexpectedError }),
    [showUnexpectedError]
  );

  return (
    <ErrorFeedbackContext.Provider value={value}>
      {children}
      <FeedbackDialog
        key={activeReport?.id ?? 'idle'}
        open={!!activeReport}
        kind="error"
        error={activeReport?.error}
        context={activeReport?.context}
        onClose={() => setActiveReport(null)}
        onSubmitted={() => {
          showSuccess(t('feedback.sent', 'Report sent.'));
        }}
      />
    </ErrorFeedbackContext.Provider>
  );
}

export function useErrorFeedback(): ErrorFeedbackContextValue {
  return (
    useContext(ErrorFeedbackContext) ?? {
      showUnexpectedError: () => false,
    }
  );
}
