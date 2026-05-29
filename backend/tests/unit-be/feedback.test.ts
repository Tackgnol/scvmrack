import { describe, it, expect, vi } from 'vitest';
import {
    recordFeedback,
    reconstructError,
    type FeedbackInput,
    type FeedbackSentry,
} from '../../feedback.js';

type CapturedFeedback = {
    feedback: Parameters<FeedbackSentry['captureFeedback']>[0];
    hint: Parameters<FeedbackSentry['captureFeedback']>[1];
};

function fakeSentry() {
    const contexts: Array<[string, Record<string, unknown> | null]> = [];
    const tags: Array<[string, string]> = [];
    const exceptions: unknown[] = [];
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
        captureFeedback: (feedback, hint) => {
            feedbacks.push({ feedback, hint });
            return 'feedback-event-id';
        },
    };

    return { sentry, contexts, tags, exceptions, feedbacks };
}

describe('reconstructError', () => {
    it('returns null when no error info is provided', () => {
        expect(reconstructError(undefined)).toBeNull();
    });

    it('rebuilds an Error with name, message, and stack', () => {
        const err = reconstructError({
            name: 'TypeError',
            message: 'Boom',
            stack: 'TypeError: Boom\n  at x',
        });

        expect(err).toBeInstanceOf(Error);
        expect(err?.name).toBe('TypeError');
        expect(err?.message).toBe('Boom');
        expect(err?.stack).toBe('TypeError: Boom\n  at x');
    });

    it('falls back to a default message when none is given', () => {
        expect(reconstructError({ name: 'Error' })?.message).toBe(
            'Unexpected error'
        );
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

        expect(exceptions).toHaveLength(1);
        expect((exceptions[0] as Error).message).toBe('Boom');
        expect(feedbacks).toHaveLength(1);
        expect(feedbacks[0].feedback.associatedEventId).toBe('exception-event-id');
        expect(feedbacks[0].feedback.message).toBe('Something broke');
        expect(feedbacks[0].feedback.source).toBe('unexpected_error_dialog');
        expect(feedbacks[0].feedback.url).toBe('https://example.test/scvm');
        expect(result.eventId).toBe('feedback-event-id');
    });

    it('sets the feedback context and tags on the scope', () => {
        const { sentry, contexts, tags } = fakeSentry();

        recordFeedback(errorInput, sentry);

        expect(contexts).toContainEqual(['feedback_context', errorInput.context]);
        expect(tags).toContainEqual(['feedback_kind', 'error']);
        expect(tags).toContainEqual(['http_status', '500']);
    });

    it('does not capture an exception for plain feedback', () => {
        const { sentry, exceptions, feedbacks } = fakeSentry();

        const result = recordFeedback(
            {
                kind: 'feedback',
                message: 'Nice app',
                source: 'feedback_form',
            },
            sentry
        );

        expect(exceptions).toHaveLength(0);
        expect(feedbacks[0].feedback.associatedEventId).toBeUndefined();
        expect(result.eventId).toBe('feedback-event-id');
    });

    it('does not capture an exception for error kind without error details', () => {
        const { sentry, exceptions } = fakeSentry();

        recordFeedback(
            { kind: 'error', message: 'broke', source: 'unexpected_error_dialog' },
            sentry
        );

        expect(exceptions).toHaveLength(0);
    });

    it('skips setting an empty context', () => {
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

        expect(contexts).toHaveLength(0);
    });
});
