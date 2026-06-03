import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  recordFeedback,
  reconstructError,
  type FeedbackInput,
  type FeedbackSentry,
} from '../../src/feedback.ts';

type CapturedFeedback = {
  feedback: Parameters<FeedbackSentry['captureFeedback']>[0];
  hint: Parameters<FeedbackSentry['captureFeedback']>[1];
};

function containsEqual(actual: unknown[], expected: unknown): boolean {
  return actual.some((item) => {
    try {
      assert.deepEqual(item, expected);
      return true;
    } catch {
      return false;
    }
  });
}

function fakeSentry() {
  const contexts: Array<[string, Record<string, unknown> | null]> = [];
  const tags: Array<[string, string]> = [];
  const exceptions: unknown[] = [];
  const messages: string[] = [];
  const feedbacks: CapturedFeedback[] = [];

  const sentry: FeedbackSentry = {
    withScope: (callback) =>
      callback({
        setContext: (name, context) => contexts.push([name, context]),
        setTag: (key, value) => tags.push([key, value]),
      }),
    captureException: (error) => {
      exceptions.push(error);
      return 'exception-event-id';
    },
    captureMessage: (message) => {
      messages.push(message);
      return 'message-event-id';
    },
    captureFeedback: (feedback, hint) => {
      feedbacks.push({ feedback, hint });
      return 'feedback-event-id';
    },
  };

  return { sentry, contexts, tags, exceptions, messages, feedbacks };
}

describe('reconstructError', () => {
  it('returns null when no error info is provided', () => {
    assert.equal(reconstructError(undefined), null);
  });

  it('rebuilds an Error with name, message, and stack', () => {
    const err = reconstructError({
      name: 'TypeError',
      message: 'Boom',
      stack: 'TypeError: Boom\n  at x',
    });

    assert.ok(err instanceof Error);
    assert.equal(err?.name, 'TypeError');
    assert.equal(err?.message, 'Boom');
    assert.equal(err?.stack, 'TypeError: Boom\n  at x');
  });

  it('falls back to a default message when none is given', () => {
    assert.equal(reconstructError({ name: 'Error' })?.message, 'Unexpected error');
  });
});

describe('recordFeedback', () => {
  const errorInput: FeedbackInput = {
    kind: 'error',
    message: 'Something broke',
    source: 'unexpected_error_dialog',
    url: 'https://example.test/scvm',
    context: { status: 500, code: 'INTERNAL_ERROR', requestId: 'req-1' },
    tags: { feedback_kind: 'error', http_status: '500' },
    error: { name: 'Error', message: 'Boom' },
  };

  it('captures the exception and associates it with the feedback', () => {
    const { sentry, exceptions, feedbacks } = fakeSentry();

    const result = recordFeedback(errorInput, sentry);

    assert.equal(exceptions.length, 1);
    assert.equal((exceptions[0] as Error).message, 'Boom');
    assert.equal(feedbacks.length, 1);
    assert.equal(feedbacks[0].feedback.associatedEventId, 'exception-event-id');
    assert.equal(feedbacks[0].feedback.message, 'Something broke');
    assert.equal(feedbacks[0].feedback.source, 'unexpected_error_dialog');
    assert.equal(feedbacks[0].feedback.url, 'https://example.test/scvm');
    assert.equal(result.eventId, 'feedback-event-id');
  });

  it('sets the feedback context and tags on the scope', () => {
    const { sentry, contexts, tags } = fakeSentry();

    recordFeedback(errorInput, sentry);

    assert.ok(containsEqual(contexts, ['feedback_context', errorInput.context]));
    assert.ok(containsEqual(tags, ['feedback_kind', 'error']));
    assert.ok(containsEqual(tags, ['http_status', '500']));
  });

  it('captures a message event for plain feedback and associates the feedback', () => {
    const { sentry, exceptions, messages, feedbacks } = fakeSentry();

    const result = recordFeedback(
      {
        kind: 'feedback',
        message: 'The report modal is broken',
        source: 'faq_bug_report',
      },
      sentry
    );

    assert.equal(exceptions.length, 0);
    assert.deepEqual(messages, ['Bug report from faq_bug_report']);
    assert.equal(feedbacks[0].feedback.associatedEventId, 'message-event-id');
    assert.equal(result.eventId, 'feedback-event-id');
  });

  it('does not capture an exception for error kind without error details', () => {
    const { sentry, exceptions } = fakeSentry();

    recordFeedback(
      { kind: 'error', message: 'broke', source: 'unexpected_error_dialog' },
      sentry
    );

    assert.equal(exceptions.length, 0);
  });

  it('skips setting an empty client context', () => {
    const { sentry, contexts } = fakeSentry();

    recordFeedback(
      {
        kind: 'feedback',
        message: 'hi',
        source: 'feedback_form',
        context: {},
      },
      sentry
    );

    assert.equal(
      contexts.some(([name]) => name === 'feedback_context'),
      false
    );
  });

  it('adds report details to Sentry context for visibility in GlitchTip', () => {
    const { sentry, contexts } = fakeSentry();

    recordFeedback(
      {
        kind: 'feedback',
        message: 'Header button failed',
        source: 'header_bug_report',
        url: 'https://example.test/character',
      },
      sentry
    );

    assert.ok(
      containsEqual(contexts, [
        'feedback_report',
        {
          kind: 'feedback',
          source: 'header_bug_report',
          url: 'https://example.test/character',
          message: 'Header button failed',
        },
      ])
    );
  });
});
