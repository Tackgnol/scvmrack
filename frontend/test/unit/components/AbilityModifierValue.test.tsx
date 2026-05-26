import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AbilityModifierValue from '@/components/atoms/AbilityModifierValue';
import UnitTestProvider from '../UnitTestProvider';

describe('AbilityModifierValue Browser PoC', () => {
  it('updates formatting when the modifier changes sign', async () => {
    const { rerender } = render(
      <UnitTestProvider>
        <AbilityModifierValue modifier={2} cacheKey="test-pos" />
      </UnitTestProvider>
    );

    expect(screen.getByText('+2')).toBeVisible();
    expect(screen.queryByText('-1')).not.toBeInTheDocument();

    rerender(
      <UnitTestProvider>
        <AbilityModifierValue modifier={-1} cacheKey="test-neg" />
      </UnitTestProvider>
    );

    expect(screen.getByText('-1')).toBeVisible();
    expect(screen.queryByText('+2')).not.toBeInTheDocument();

    rerender(
      <UnitTestProvider>
        <AbilityModifierValue modifier={0} cacheKey="test-zero" />
      </UnitTestProvider>
    );

    expect(screen.getByText('+0')).toBeVisible();
    expect(screen.queryByText('-1')).not.toBeInTheDocument();
  });
});
