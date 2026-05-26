import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ModifierStatChip from '@/components/atoms/ModifierStatChip';
import UnitTestProvider from '../UnitTestProvider';

describe('ModifierStatChip Browser', () => {
  it('updates the displayed stat label when props change', async () => {
    const { rerender } = render(
      <UnitTestProvider>
        <ModifierStatChip label="STR +2" />
      </UnitTestProvider>
    );

    expect(screen.getByText('STR +2')).toBeVisible();

    rerender(
      <UnitTestProvider>
        <ModifierStatChip label="AGI -1" density="compact" />
      </UnitTestProvider>
    );

    expect(screen.getByText('AGI -1')).toBeVisible();
    expect(screen.queryByText('STR +2')).not.toBeInTheDocument();
  });
});
