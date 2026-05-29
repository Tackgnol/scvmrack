import { getCsrfToken } from '@/api';

const FEEDBACK_ENDPOINT = '/api/feedback';

function resolveBackendUrl(path: string): string {
  const base = import.meta.env.VITE_BACKEND_URL ?? '';
  return base ? `${base}${path}` : path;
}

export type FeedbackErrorInfo = {
  name?: string;
  message?: string;
  stack?: string;
};

export type FeedbackReport = {
  kind: 'error' | 'feedback';
  message: string;
  source: string;
  url: string;
  context: Record<string, unknown>;
  tags: Record<string, string>;
  error?: FeedbackErrorInfo;
};

export function serializeError(error: unknown): FeedbackErrorInfo | undefined {
  if (error === undefined || error === null) {
    return undefined;
  }

  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }

  if (typeof error === 'object') {
    const record = error as Record<string, unknown>;
    const message =
      typeof record.message === 'string' ? record.message : JSON.stringify(record);
    return { message: message.slice(0, 2000) };
  }

  return { message: String(error).slice(0, 2000) };
}

/**
 * Sends a feedback / unexpected-error report to the backend, which forwards it to
 * GlitchTip server-side. Returns the resulting event id (empty when the backend
 * has no Sentry DSN configured).
 */
export async function sendFeedbackReport(report: FeedbackReport): Promise<string> {
  const token = await getCsrfToken();

  const response = await fetch(resolveBackendUrl(FEEDBACK_ENDPOINT), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'x-csrf-token': token } : {}),
    },
    body: JSON.stringify(report),
  });

  if (!response.ok) {
    throw new Error(`Feedback submission failed with status ${response.status}`);
  }

  const data = (await response.json()) as { eventId?: string };
  return data.eventId ?? '';
}
