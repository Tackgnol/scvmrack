import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import SummaryStatButton from '@/components/molecules/SummaryStatButton';
import UnitTestProvider from '../../UnitTestProvider';
import { Typography } from '@mui/material';

describe('SummaryStatButton', () => {
  const defaultProps = {
    label: 'STRENGTH',
    isActive: false,
    onHoverOpen: vi.fn(),
    onHoverClose: vi.fn(),
    onPinToggle: vi.fn(),
  };

  it('renders label and children', async () => {
    render(
      <UnitTestProvider>
        <SummaryStatButton {...defaultProps}>
          <Typography variant="h6">18</Typography>
        </SummaryStatButton>
      </UnitTestProvider>
    );

    expect(screen.getByText('STRENGTH')).toBeTruthy();
    expect(screen.getByText('18')).toBeTruthy();
  });

  it('triggers onPinToggle when clicked', async () => {
    const onPinToggle = vi.fn();
    render(
      <UnitTestProvider>
        <SummaryStatButton {...defaultProps} onPinToggle={onPinToggle} />
      </UnitTestProvider>
    );

    const user = userEvent.setup();
    const button = screen.getByRole('button', { name: /STRENGTH/i });
    await user.click(button);

    await waitFor(() => expect(onPinToggle).toHaveBeenCalled());
  });

  it('sets aria-expanded="false" when isActive is false', async () => {
    render(
      <UnitTestProvider>
        <SummaryStatButton {...defaultProps} isActive={false} />
      </UnitTestProvider>
    );

    const button = screen.getByRole('button', { name: /STRENGTH/i });
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('sets aria-expanded="true" when isActive is true', async () => {
    render(
      <UnitTestProvider>
        <SummaryStatButton {...defaultProps} isActive={true} />
      </UnitTestProvider>
    );

    const button = screen.getByRole('button', { name: /STRENGTH/i });
    expect(button.getAttribute('aria-expanded')).toBe('true');
  });
});
