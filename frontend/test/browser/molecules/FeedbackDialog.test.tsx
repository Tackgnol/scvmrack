import FeedbackDialog from '@/components/molecules/feedback/FeedbackDialog';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

type CapturedRequest = {
  url: string;
  body: Record<string, unknown>;
};

let feedbackRequests: CapturedRequest[];
let fetchSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  feedbackRequests = [];

  fetchSpy = vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async (input, init) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url.includes('/api/csrf-token')) {
        return new Response(JSON.stringify({ token: 'csrf-token' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (url.includes('/api/feedback')) {
        feedbackRequests.push({
          url,
          body: JSON.parse(String(init?.body ?? '{}')),
        });
        return new Response(JSON.stringify({ eventId: 'feedback-event-id' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`Unexpected fetch to ${url}`);
    });
});

afterEach(() => {
  fetchSpy.mockRestore();
});

describe('FeedbackDialog', () => {
  it('posts an enriched error report to the backend when submitted', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <FeedbackDialog
          open
          kind="error"
          error={new Error('Boom')}
          context={{ source: 'unit-test' }}
          onClose={() => {}}
          onSubmitted={() => {}}
        />
      </I18nextProvider>
    );

    const textbox = await screen.findByTestId('feedback-message');
    await userEvent.type(textbox, 'Something broke');
    await userEvent.click(screen.getByText(/send report/i));

    await expect.poll(() => feedbackRequests).toHaveLength(1);
    const [request] = feedbackRequests;
    expect(request.url).toContain('/api/feedback');
    expect(request.body.kind).toBe('error');
    expect(request.body.message).toBe('Something broke');
    expect(request.body.source).toBe('unexpected_error_dialog');
    expect((request.body.error as { message?: string }).message).toBe('Boom');
    expect((request.body.tags as Record<string, string>).feedback_kind).toBe(
      'error'
    );
  });

  it('posts manual feedback with a custom report source', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <FeedbackDialog
          open
          kind="feedback"
          source="faq_bug_report"
          context={{ source: 'faq_bug_report' }}
          title="Report a bug"
          onClose={() => {}}
          onSubmitted={() => {}}
        />
      </I18nextProvider>
    );

    const dialog = screen.getByRole('dialog', { name: /report a bug/i });
    const textbox = await within(dialog).findByTestId('feedback-message');
    await userEvent.type(textbox, 'The FAQ button opened a report');
    await userEvent.click(within(dialog).getByText(/send report/i));

    expect(feedbackRequests).toHaveLength(1);
    const [request] = feedbackRequests;
    expect(request.body.kind).toBe('feedback');
    expect(request.body.source).toBe('faq_bug_report');
    expect((request.body.tags as Record<string, string>).feedback_source).toBe(
      'faq_bug_report'
    );
  });
});
