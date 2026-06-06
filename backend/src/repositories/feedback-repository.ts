import * as Sentry from '@sentry/node';
import type { FeedbackSentry } from '../feedback.js';

/**
 * Feedback "data" layer: the external sink (GlitchTip via the Sentry SDK). The
 * adapter keeps the feedback logic decoupled from the SDK namespace.
 */

const sentryAdapter: FeedbackSentry = {
  withScope: (callback) => Sentry.withScope((scope) => callback(scope)),
  captureException: (error) => Sentry.captureException(error),
  captureMessage: (message) => Sentry.captureMessage(message),
  captureFeedback: (feedback, hint) => Sentry.captureFeedback(feedback, hint),
};

export const feedbackRepository = {
  /** Whether the upstream sink is configured/available. */
  isAvailable(): boolean {
    return Sentry.isInitialized();
  },
  /** The Sentry adapter used to forward feedback. */
  sink: sentryAdapter,
};
