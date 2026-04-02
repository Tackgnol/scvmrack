import { render } from 'vitest-browser-react';
import { expect, describe, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import UsePipsGroup from '@/components/molecules/uses/UsePipsGroup';
import BrowserTestProvider from '../../BrowserTestProvider';

describe('UsePipsGroup Browser', () => {
  const defaultProps = {
    uses: [true, false],
    isUsePending: vi.fn().mockReturnValue(false),
    createPipLabel: (idx: number, used: boolean) => `Pip ${idx} ${used ? 'used' : 'available'}`,
    onToggleUse: vi.fn(),
    pipTestId: 'test-pip',
  };

  it('renders correct number of pips', async () => {
    await render(
      <BrowserTestProvider>
        <UsePipsGroup {...defaultProps} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByRole('button', { name: 'Pip 0 used' })).toBeVisible();
    await expect.element(page.getByRole('button', { name: 'Pip 1 available' })).toBeVisible();

    const pips = page.getByTestId('test-pip');
    const pipsArray = await pips.all();
    expect(pipsArray.length).toBe(2);

  });

  it('triggers onToggleUse when a pip is clicked', async () => {
    const onToggleUse = vi.fn();
    await render(
      <BrowserTestProvider>
        <UsePipsGroup {...defaultProps} onToggleUse={onToggleUse} />
      </BrowserTestProvider>
    );

    const firstPip = page.getByRole('button', { name: 'Pip 0 used' });
    await userEvent.click(firstPip);

    await expect.poll(() => onToggleUse).toHaveBeenCalledWith(0);

  });
});
