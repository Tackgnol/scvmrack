import { render } from 'vitest-browser-react';
import { expect, describe, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import SummaryDetailPopper from '@/components/molecules/summary/SummaryDetailPopper';
import BrowserTestProvider from '../../BrowserTestProvider';

describe('SummaryDetailPopper Browser', () => {
  const defaultProps = {
    open: true,
    anchorEl: document.createElement('div'),
    accentColor: '#ff0000',
    onClickAway: vi.fn(),
    onMouseEnter: vi.fn(),
    onMouseLeave: vi.fn(),
  };

  it('renders children when open', async () => {
    await render(
      <BrowserTestProvider>
        <SummaryDetailPopper {...defaultProps}>
          <div data-testid="popper-content">Popper Content</div>
        </SummaryDetailPopper>
      </BrowserTestProvider>
    );

    await expect.element(page.getByTestId('popper-content')).toBeVisible();

  });

  it('calls onMouseEnter and onMouseLeave', async () => {
    await render(
      <BrowserTestProvider>
        <SummaryDetailPopper {...defaultProps}>
          <div data-testid="popper-content">Popper Content</div>
        </SummaryDetailPopper>
      </BrowserTestProvider>
    );

    const content = page.getByTestId('popper-content');
    
    // MUI Paper is a parent of our div, so we hover the div
    await userEvent.hover(content);
    await expect.poll(() => defaultProps.onMouseEnter).toHaveBeenCalled();

    await userEvent.unhover(content);
    await expect.poll(() => defaultProps.onMouseLeave).toHaveBeenCalled();

  });

  it('calls onClickAway when clicking outside', async () => {
    const outside = document.createElement('div');
    outside.setAttribute('data-testid', 'outside');
    outside.textContent = 'Outside';
    // Ensure it's not covered and is large enough
    outside.style.position = 'fixed';
    outside.style.top = '0';
    outside.style.right = '0';
    outside.style.width = '100px';
    outside.style.height = '100px';
    outside.style.zIndex = '9999';
    document.body.appendChild(outside);

    try {
      await render(
        <BrowserTestProvider>
          <SummaryDetailPopper {...defaultProps} open={true}>
            <div>Popper Content</div>
          </SummaryDetailPopper>
        </BrowserTestProvider>
      );

      await userEvent.click(page.getByTestId('outside'));
      await expect.poll(() => defaultProps.onClickAway).toHaveBeenCalled();
    } finally {
      document.body.removeChild(outside);
    }
  });
});
