import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { describe, it, expect, vi } from 'vitest';
import ComputedModifierTag from '@/components/molecules/ComputedModifierTag';
import BrowserTestProvider from '../BrowserTestProvider';

describe('ComputedModifierTag Browser', () => {
  const mockModifier = {
    id: 'test-mod',
    statistic: 'strength',
    value: 2,
    originName: 'Belt of Giant Strength',
    type: 'computed' as const,
  };

  const defaultProps = {
    modifier: mockModifier,
    onOpen: vi.fn(),
    isFull: false,
  };

  it('renders origin name, statistic, and value', async () => {
    await render(
      <BrowserTestProvider>
        <ComputedModifierTag {...defaultProps} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('Belt of Giant Strength')).toBeVisible();
    await expect.element(page.getByText('STRENGTH', { exact: true })).toBeVisible();
    await expect.element(page.getByText('+2')).toBeVisible();

  });

  it('triggers onOpen when clicked', async () => {
    const onOpen = vi.fn();
    await render(
      <BrowserTestProvider>
        <ComputedModifierTag {...defaultProps} onOpen={onOpen} />
      </BrowserTestProvider>
    );

    const tag = page.getByRole('button');
    await userEvent.click(tag);

    await expect.poll(() => onOpen).toHaveBeenCalledWith(mockModifier);

  });
});
