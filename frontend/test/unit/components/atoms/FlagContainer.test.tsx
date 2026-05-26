import { render, screen } from '@testing-library/react';
import { expect, describe, it } from 'vitest';
import { FlagContainer } from '@/components/atoms/FlagContainer';
import UnitTestProvider from '../../UnitTestProvider';

describe('FlagContainer Component', () => {
    it('updates the rendered child content when its children change', async () => {
        const { rerender } = render(
            <UnitTestProvider>
                <FlagContainer>
                    <div data-testid="test-child">Child Content</div>
                </FlagContainer>
            </UnitTestProvider>
        );

        const child = screen.getByTestId('test-child');
        expect(child).toBeVisible();
        expect(screen.getByText('Child Content')).toBeVisible();

        rerender(
            <UnitTestProvider>
                <FlagContainer>
                    <div data-testid="test-child">Updated Content</div>
                </FlagContainer>
            </UnitTestProvider>
        );

        expect(screen.getByText('Updated Content')).toBeVisible();
        expect(screen.queryByText('Child Content')).not.toBeInTheDocument();
    });
});
