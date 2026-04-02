import {Statistic} from "@/hooks/models.ts";
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { describe, it, expect, vi } from 'vitest';
import CustomModifierTag from '@/components/molecules/CustomModifierTag';
import BrowserTestProvider from '../BrowserTestProvider';

describe('CustomModifierTag Browser', () => {
  const mockModifier = {
    id: 'test-custom',
    name: 'Custom Bonus',
    statistic: 'agility' as Statistic,
    value: 1,
    comment: 'A special comment',
    type: 'custom' as const,
  };

  const defaultProps = {
    modifier: mockModifier,
    onRemove: vi.fn(),
    onEdit: vi.fn(),
    isFull: false,
    removeLabel: 'Remove modifier',
  };

  it('renders name, statistic, and value', async () => {
    await render(
      <BrowserTestProvider>
        <CustomModifierTag {...defaultProps} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('Custom Bonus')).toBeVisible();
    await expect.element(page.getByText('AGILITY', { exact: true })).toBeVisible();
    await expect.element(page.getByText('+1')).toBeVisible();

  });

  it('triggers onEdit when clicked', async () => {
    const onEdit = vi.fn();
    await render(
      <BrowserTestProvider>
        <CustomModifierTag {...defaultProps} onEdit={onEdit} />
      </BrowserTestProvider>
    );

    const tag = page.getByText('Custom Bonus');
    await userEvent.click(tag);

    await expect.poll(() => onEdit).toHaveBeenCalled();

  });

  it('triggers onRemove when close button is clicked', async () => {
    const onRemove = vi.fn();
    await render(
      <BrowserTestProvider>
        <CustomModifierTag {...defaultProps} onRemove={onRemove} />
      </BrowserTestProvider>
    );

    const removeButton = page.getByRole('button', {
      name: 'Remove modifier: Custom Bonus',
      exact: true,
    });
    await expect.element(removeButton).toBeVisible();

    await userEvent.click(removeButton);

    await expect.poll(() => onRemove).toHaveBeenCalled();

  });
});
