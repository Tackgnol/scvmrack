import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { describe, it, expect } from 'vitest';
import ModifierShiftBadge from '@/components/atoms/ModifierShiftBadge';
import BrowserTestProvider from './BrowserTestProvider';

describe('ModifierShiftBadge Browser', () => {
  it('updates the badge label and keeps it non-interactive', async () => {
    const { rerender } = await render(
      <BrowserTestProvider>
        <ModifierShiftBadge label="SHIFT" reduceMotion={true} />
      </BrowserTestProvider>
    );

    const badge = page.getByText('SHIFT');
    await expect.element(badge).toBeVisible();
    expect(window.getComputedStyle(badge.element()!).pointerEvents).toBe('none');

    await rerender(
      <BrowserTestProvider>
        <ModifierShiftBadge label="BONUS" reduceMotion={false} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('BONUS')).toBeVisible();
    await expect.element(page.getByText('SHIFT')).not.toBeInTheDocument();
  });
});
