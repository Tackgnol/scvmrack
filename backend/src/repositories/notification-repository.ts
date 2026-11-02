import * as Sentry from '@sentry/node';

export const notificationRepository = {
  /** Report notification failures without carrying sheet, identity or request data. */
  reportFailure(stage: 'audience_lookup' | 'publish'): void {
    try {
      if (!Sentry.isInitialized()) {
        return;
      }
      Sentry.withScope(scope => {
        scope.addEventProcessor(event => ({
          event_id: event.event_id,
          timestamp: event.timestamp,
          platform: event.platform,
          level: 'error',
          exception: event.exception,
          release: event.release,
          environment: event.environment,
          sdk: event.sdk,
          tags: { source: 'backend', operation: 'character.notification', notification_stage: stage },
          fingerprint: ['character.notification', stage],
        }));
        Sentry.captureException(new Error(`Character notification failed: ${stage}`));
      });
    } catch {
      // Reporting is best-effort too; the committed save remains successful.
    }
  },
};
