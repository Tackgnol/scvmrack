import { render } from 'vitest-browser-react';
import { expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import type { AnchorHTMLAttributes } from 'react';
import { AppFooter } from '@/components/molecules/AppFooter';
import { requestOpenPrivacyDrawer } from '@/privacy/privacyDrawerBus';
import BrowserTestProvider from '../BrowserTestProvider';

vi.mock('@/privacy/privacyDrawerBus', () => ({ requestOpenPrivacyDrawer: vi.fn() }));
vi.mock('@tanstack/react-router', () => ({ Link: ({ to, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => <a href={to} {...props} /> }));
it('offers privacy settings in the shared footer', async () => {
  await render(<BrowserTestProvider><AppFooter /></BrowserTestProvider>);
  await userEvent.click(page.getByRole('button', { name: 'Review your privacy settings' }));
  await expect.poll(() => requestOpenPrivacyDrawer).toHaveBeenCalledOnce();
});
