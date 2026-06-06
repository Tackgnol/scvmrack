import { recordFeedback, type FeedbackInput } from '../feedback.js';
import { feedbackRepository } from '../repositories/feedback-repository.js';
import {
  fail,
  ok,
  unexpected,
  type ServiceLogger,
  type ServiceResult,
} from './result.js';

export type FeedbackSubmitResult = {
  eventId: string;
  /** False when the sink is not configured and the report was dropped. */
  forwarded: boolean;
};

/**
 * Feedback orchestration behind a stable {@link ServiceResult}. Forwards the
 * report to the configured sink, or reports it as not-forwarded when the sink is
 * unavailable.
 */
export function createFeedbackService(log: ServiceLogger) {
  return {
    submit(input: FeedbackInput): ServiceResult<FeedbackSubmitResult> {
      if (!feedbackRepository.isAvailable()) {
        return ok({ eventId: '', forwarded: false });
      }

      try {
        const { eventId } = recordFeedback(input, feedbackRepository.sink);
        return ok({ eventId, forwarded: true });
      } catch (err) {
        return fail(unexpected(log, err, 'FEEDBACK_FORWARD_FAILED', 'Failed to record feedback'));
      }
    },
  };
}
