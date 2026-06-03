export type FeedbackKind = 'error' | 'feedback';

export type FeedbackErrorInfo = {
  name?: string;
  message?: string;
  stack?: string;
};

export type FeedbackInput = {
  kind: FeedbackKind;
  message: string;
  source: string;
  url?: string;
  context?: Record<string, unknown>;
  tags?: Record<string, string>;
  error?: FeedbackErrorInfo;
};

export type FeedbackResult = {
  eventId: string;
};

type FeedbackPayload = {
  message: string;
  source?: string;
  url?: string;
  associatedEventId?: string;
  tags?: Record<string, string>;
};

export interface FeedbackScope {
  setContext(name: string, context: Record<string, unknown> | null): void;
  setTag(key: string, value: string): void;
}

/**
 * Minimal seam over the Sentry SDK so feedback handling stays unit-testable.
 * Mirrors the browser-side capture interface used by the frontend.
 */
export interface FeedbackSentry {
  withScope(callback: (scope: FeedbackScope) => void): void;
  captureException(error: unknown): string;
  captureMessage(message: string): string;
  captureFeedback(
    feedback: FeedbackPayload,
    hint?: { includeReplay?: boolean }
  ): string;
}

export function reconstructError(info: FeedbackErrorInfo | undefined): Error | null {
  if (!info) {
    return null;
  }

  const error = new Error(info.message ?? 'Unexpected error');
  if (info.name) {
    error.name = info.name;
  }
  if (info.stack) {
    error.stack = info.stack;
  }

  return error;
}

function reportTitle(input: FeedbackInput): string {
  if (input.kind === 'feedback') {
    return input.source.includes('bug_report')
      ? `Bug report from ${input.source}`
      : `Feedback report from ${input.source}`;
  }

  return `Error feedback from ${input.source}`;
}

/**
 * Forwards a client-submitted feedback report to GlitchTip/Sentry. For error
 * reports the original exception is captured first so the feedback can reference
 * it via associatedEventId, matching the previous browser-side behaviour.
 */
export function recordFeedback(
  input: FeedbackInput,
  sentry: FeedbackSentry
): FeedbackResult {
  let associatedEventId: string | undefined;
  let feedbackEventId = '';

  sentry.withScope((scope) => {
    if (input.context && Object.keys(input.context).length > 0) {
      scope.setContext('feedback_context', input.context);
    }
    scope.setContext('feedback_report', {
      kind: input.kind,
      source: input.source,
      url: input.url,
      message: input.message,
    });

    for (const [key, value] of Object.entries(input.tags ?? {})) {
      scope.setTag(key, value);
    }

    const error = reconstructError(input.error);
    if (input.kind === 'error' && error) {
      associatedEventId = sentry.captureException(error);
    } else if (input.kind === 'feedback') {
      associatedEventId = sentry.captureMessage(reportTitle(input));
    }

    feedbackEventId = sentry.captureFeedback(
      {
        message: input.message,
        source: input.source,
        url: input.url,
        associatedEventId,
        tags: input.tags,
      },
      { includeReplay: false }
    );
  });

  return { eventId: feedbackEventId };
}
