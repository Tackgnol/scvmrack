import assert from 'node:assert/strict';
import { beforeEach, mock, test } from 'node:test';
import type { FeedbackInput } from '../../src/feedback.ts';

const state = {
  available: true,
  recordError: null as unknown,
  recordCalls: 0,
};

function resetState(): void {
  state.available = true;
  state.recordError = null;
  state.recordCalls = 0;
}

mock.module('../../src/repositories/feedback-repository.js', {
  namedExports: {
    feedbackRepository: {
      isAvailable: () => state.available,
      sink: {},
    },
  },
});

mock.module('../../src/feedback.js', {
  namedExports: {
    recordFeedback: () => {
      state.recordCalls++;
      if (state.recordError) throw state.recordError;
      return { eventId: 'feedback-event-id' };
    },
  },
});

const { createFeedbackService } = await import('../../src/services/feedback-service.js');
const service = () => createFeedbackService({ error: () => {} });

const input: FeedbackInput = {
  kind: 'feedback',
  message: 'hi',
  source: 'faq_bug_report',
};

beforeEach(() => {
  resetState();
});

test('submit drops the report (not forwarded) when the sink is unavailable', () => {
  state.available = false;
  const r = service().submit(input);
  assert.equal(r.ok, true);
  assert.deepEqual((r as any).value, { eventId: '', forwarded: false });
  assert.equal(state.recordCalls, 0);
});

test('submit forwards the report when the sink is available', () => {
  const r = service().submit(input);
  assert.equal(r.ok, true);
  assert.deepEqual((r as any).value, { eventId: 'feedback-event-id', forwarded: true });
  assert.equal(state.recordCalls, 1);
});

test('submit maps an unexpected forward failure to 5xx', () => {
  state.recordError = new Error('sentry exploded');
  const r = service().submit(input);
  assert.equal(r.ok, false);
  assert.equal((r as any).error.statusCode, 500);
  assert.equal((r as any).error.code, 'FEEDBACK_FORWARD_FAILED');
});
