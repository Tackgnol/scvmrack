import { render } from 'vitest-browser-react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import i18n from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { LegalChangeBanner } from '@/components/organisms/LegalChangeBanner/LegalChangeBanner';
import type { LegalChangeNotice } from '@/legal/legalNotices';
import { getPrivacySettings, savePrivacySettings } from '@/privacy/privacySettings';
import BrowserTestProvider from '../BrowserTestProvider';

vi.mock('@/hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: { children: ReactNode; to: string } & AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={to} {...props}>{children}</a>
  ),
}));

const notice: LegalChangeNotice = {
  kind: 'terms',
  date: '2026-10-09',
  effectiveDate: '2026-10-23',
  summary: { en: 'Publishing rules changed.', pl: 'Zmieniły się zasady publikacji.' },
};

describe('LegalChangeBanner', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
    localStorage.removeItem('scvmrack-legal-notice:user-banner:terms:2026-10-09');
    localStorage.removeItem('scvmrack-legal-notice:user-banner:terms:2026-11-01');
    localStorage.removeItem('scvmrack-legal-notice:user-banner:privacy:2026-10-09');
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-banner' },
      isAuthenticated: true,
    } as ReturnType<typeof useAuth>);
  });

  it('shows a dated notice once and shows a later notice again', async () => {
    const view = await render(
      <BrowserTestProvider><LegalChangeBanner notice={notice} /></BrowserTestProvider>,
    );
    await expect.element(page.getByRole('status')).toBeVisible();
    await expect.element(page.getByText('Publishing rules changed.')).toBeVisible();
    await userEvent.click(page.getByRole('button', { name: 'Dismiss' }));
    await expect.element(page.getByText('Publishing rules changed.')).not.toBeInTheDocument();

    await view.rerender(
      <BrowserTestProvider><LegalChangeBanner notice={{ ...notice, date: '2026-11-01', effectiveDate: '2026-11-15' }} /></BrowserTestProvider>,
    );
    await expect.element(page.getByText('Publishing rules changed.')).toBeVisible();
  });

  it('does not show a signed-out visitor a notice', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
    } as ReturnType<typeof useAuth>);
    await render(
      <BrowserTestProvider><LegalChangeBanner notice={notice} /></BrowserTestProvider>,
    );
    await expect.element(page.getByText('Publishing rules changed.')).not.toBeInTheDocument();
  });

  it('shows a privacy change once without changing the analytics choice', async () => {
    savePrivacySettings({ acknowledged: true, analyticsEnabled: true });
    await render(
      <BrowserTestProvider><LegalChangeBanner notice={{ ...notice, kind: 'privacy' }} /></BrowserTestProvider>,
    );
    await expect.element(page.getByRole('status')).toBeVisible();
    await expect.element(page.getByRole('link', { name: 'Read the notice' })).toHaveAttribute('href', '/privacy');
    await userEvent.click(page.getByRole('button', { name: 'Dismiss' }));
    await expect.element(page.getByRole('status')).not.toBeInTheDocument();
    expect(getPrivacySettings().analyticsEnabled).toBe(true);
  });
});
