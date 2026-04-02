import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { describe, it, expect, vi } from 'vitest';
import UsePipButton from '@/components/atoms/UsePipButton';
import BrowserTestProvider from './BrowserTestProvider';

describe('UsePipButton Browser', () => {
  it('triggers onClick when clicked', async () => {
    const onClick = vi.fn();
    await render(
      <BrowserTestProvider>
        <UsePipButton 
            used={false} 
            isPending={false} 
            ariaLabel="Use Power" 
            onClick={onClick} 
            testId="pip-button"
        />
      </BrowserTestProvider>
    );

    const button = page.getByTestId('pip-button');
    await expect.element(button).toBeVisible();
    await userEvent.click(button);
    
    await expect.poll(() => onClick).toHaveBeenCalled();

  });

  it('is disabled/busy when pending', async () => {
    await render(
        <BrowserTestProvider>
          <UsePipButton 
              used={false} 
              isPending={true} 
              ariaLabel="Use Power" 
              onClick={() => {}} 
              testId="pip-button"
          />
        </BrowserTestProvider>
    );
  
    const button = page.getByTestId('pip-button');
    await expect.element(button).toHaveAttribute('aria-busy', 'true');

  });
});
