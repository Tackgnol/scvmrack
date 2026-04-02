import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { describe, it, expect, vi } from 'vitest';
import SummaryStatButton from '@/components/molecules/SummaryStatButton';
import BrowserTestProvider from '../BrowserTestProvider';
import { Typography } from '@mui/material';

describe('SummaryStatButton Browser', () => {
  const defaultProps = {
    label: 'STRENGTH',
    isActive: false,
    onHoverOpen: vi.fn(),
    onHoverClose: vi.fn(),
    onPinToggle: vi.fn(),
  };

  it('renders label and children', async () => {
    await render(
      <BrowserTestProvider>
        <SummaryStatButton {...defaultProps}>
          <Typography variant="h6">18</Typography>
        </SummaryStatButton>
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('STRENGTH')).toBeVisible();
    await expect.element(page.getByText('18')).toBeVisible();

  });

  it('triggers onPinToggle when clicked', async () => {
    const onPinToggle = vi.fn();
    await render(
      <BrowserTestProvider>
        <SummaryStatButton {...defaultProps} onPinToggle={onPinToggle} />
      </BrowserTestProvider>
    );

    const button = page.getByRole('button', { name: /STRENGTH/i });
    await userEvent.click(button);

    await expect.poll(() => onPinToggle).toHaveBeenCalled();

  });

  it('sets aria-expanded="false" when isActive is false', async () => {
    await render(
      <BrowserTestProvider>
        <SummaryStatButton {...defaultProps} isActive={false} />
      </BrowserTestProvider>
    );

    const button = page.getByRole('button', { name: /STRENGTH/i });
    await expect.element(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('sets aria-expanded="true" when isActive is true', async () => {
    await render(
      <BrowserTestProvider>
        <SummaryStatButton {...defaultProps} isActive={true} />
      </BrowserTestProvider>
    );

    const button = page.getByRole('button', { name: /STRENGTH/i });
    await expect.element(button).toHaveAttribute('aria-expanded', 'true');
  });
});
