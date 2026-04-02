import { render } from 'vitest-browser-react';
import { expect, describe, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import UseSectionLabel from '@/components/molecules/uses/UseSectionLabel';
import BrowserTestProvider from '../../BrowserTestProvider';

describe('UseSectionLabel Browser', () => {
  it('renders title', async () => {
    await render(
      <BrowserTestProvider>
        <UseSectionLabel title="Powers" hasPendingSave={false} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('Powers')).toBeVisible();

  });

  it('renders saving indicator when hasPendingSave is true', async () => {
    await render(
      <BrowserTestProvider>
        <UseSectionLabel title="Powers" hasPendingSave={true} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText(/saving/i)).toBeVisible();

  });
});
