import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ItemQuantityBadge from '@/components/atoms/ItemQuantityBadge';
import UnitTestProvider from '../UnitTestProvider';

describe('ItemQuantityBadge Browser', () => {
  it('only renders when quantity exceeds one and reflects symbol changes', async () => {
    const { rerender } = render(
      <UnitTestProvider>
        <ItemQuantityBadge quantity={1} cacheKey="test-q1" />
      </UnitTestProvider>
    );

    expect(screen.queryByText('x')).not.toBeInTheDocument();
    expect(screen.queryByText('5')).not.toBeInTheDocument();

    rerender(
      <UnitTestProvider>
        <ItemQuantityBadge quantity={5} cacheKey="test-q5" symbol="*" />
      </UnitTestProvider>
    );

    expect(screen.getByText('5*')).toBeVisible();

    rerender(
      <UnitTestProvider>
        <ItemQuantityBadge quantity={1} cacheKey="test-q1-again" symbol="*" />
      </UnitTestProvider>
    );

    expect(screen.queryByText('5*')).not.toBeInTheDocument();
  });
});
