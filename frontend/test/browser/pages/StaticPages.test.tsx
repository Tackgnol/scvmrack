import { render } from 'vitest-browser-react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import BrowserTestProvider from '../BrowserTestProvider';
import { ErrorFeedbackProvider } from '@/components/molecules/feedback/ErrorFeedbackProvider';
import { FaqPage } from '@/pages/FaqPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ReleasePage } from '@/pages/ReleasePage';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

type MockLinkProps = {
  children: ReactNode;
  to: string;
} & AnchorHTMLAttributes<HTMLAnchorElement>;

vi.mock('@/seo/Seo', () => ({
  Seo: () => null,
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: MockLinkProps) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

describe('static route pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders FAQ content and home navigation', async () => {
    await render(
      <BrowserTestProvider>
        <FaqPage />
      </BrowserTestProvider>
    );

    await expect
      .element(page.getByRole('heading', { name: /frequently asked questions/i }))
      .toBeVisible();
    await expect
      .element(page.getByRole('link', { name: /^back$/i }))
      .toBeVisible();
    await expect.element(page.getByText(/what is m.rk borg/i)).toBeVisible();
  });

  it('opens the bug report dialog from the FAQ bug answer', async () => {
    await render(
      <BrowserTestProvider>
        <ErrorFeedbackProvider>
          <FaqPage />
        </ErrorFeedbackProvider>
      </BrowserTestProvider>
    );

    await userEvent.click(page.getByText(/i found a bug/i));

    const reportButton = page.getByRole('button', { name: /open bug report/i });
    await expect.element(reportButton).toBeVisible();
    await userEvent.click(reportButton);

    await expect
      .element(page.getByRole('dialog', { name: /report a bug/i }))
      .toBeVisible();
  });

  it('renders release notes with typed release chips', async () => {
    await render(
      <BrowserTestProvider>
        <ReleasePage />
      </BrowserTestProvider>
    );

    await expect
      .element(page.getByRole('heading', { name: /release notes/i }))
      .toBeVisible();
    await expect.element(page.getByText('v0.2.0')).toBeVisible();
    // Multiple releases now carry a "Minor" chip, so scope to the first match
    // instead of a strict single-element assertion.
    await expect.element(page.getByText(/minor/i).first()).toBeVisible();
  });

  it('renders router-mode not found page with a home link', async () => {
    await render(
      <BrowserTestProvider>
        <NotFoundPage />
      </BrowserTestProvider>
    );

    await expect.element(page.getByRole('heading', { name: /404/i })).toBeVisible();
    await expect
      .element(page.getByRole('link', { name: /back to home/i }))
      .toHaveAttribute('href', '/');
  });

  it('renders anchor-mode not found page with custom copy', async () => {
    await render(
      <BrowserTestProvider>
        <NotFoundPage
          homeLinkMode="anchor"
          heading="Lost"
          tagline="The rack rejects this path"
          stamp="Misfiled"
        />
      </BrowserTestProvider>
    );

    await expect.element(page.getByRole('heading', { name: /lost/i })).toBeVisible();
    await expect.element(page.getByText(/the rack rejects this path/i)).toBeVisible();
    await expect.element(page.getByText(/misfiled/i)).toBeVisible();
    await expect
      .element(page.getByRole('link', { name: /back to home/i }))
      .toHaveAttribute('href', '/');
  });
});
