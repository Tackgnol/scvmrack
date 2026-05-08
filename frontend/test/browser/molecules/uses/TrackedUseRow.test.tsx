import { render } from 'vitest-browser-react';
import { expect, describe, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import TrackedUseRow from '@/components/molecules/uses/TrackedUseRow';
import BrowserTestProvider from '../../BrowserTestProvider';

describe('TrackedUseRow Browser', () => {
  const defaultProps = {
    number: 1,
    name: 'Test Power',
    description: 'Power Description',
    uses: [false, false, false],
    isUsePending: vi.fn().mockReturnValue(false),
    createPipLabel: (idx: number, used: boolean) => `Pip ${idx} ${used ? 'used' : 'available'}`,
    onToggleUse: vi.fn(),
  };

  it('renders name and description', async () => {
    await render(
      <BrowserTestProvider>
        <TrackedUseRow {...defaultProps} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('Test Power')).toBeVisible();
    await expect.element(page.getByText('Power Description')).toBeVisible();
    await expect.element(page.getByText('1')).toBeVisible();

  });

  it('renders pips via UsePipsGroup', async () => {
    await render(
      <BrowserTestProvider>
        <TrackedUseRow {...defaultProps} />
      </BrowserTestProvider>
    );

    const buttons = page.getByRole('button');
    await expect.poll(async () => (await buttons.all()).length).toBe(3);

  });
});
