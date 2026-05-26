import { render, screen, waitFor } from '@testing-library/react';
import { expect, describe, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { Flag } from '@/components/atoms/Flag';
import UnitTestProvider from '../../UnitTestProvider';
import { CharacterContext } from '@/CharacterContext/CharacterContext';

describe('Flag Component', () => {
    it('updates the rendered locale button when props change', async () => {
        const mockChangeLocale = vi.fn();
        const enContextValue = {
            locale: 'en',
            changeLocale: mockChangeLocale,
        } as any;

        const { rerender } = render(
            <UnitTestProvider>
                <CharacterContext.Provider value={enContextValue}>
                    <Flag locale="en" />
                </CharacterContext.Provider>
            </UnitTestProvider>
        );

        const button = screen.getByRole('button', { name: 'English' });
        expect(button).toBeVisible();

        rerender(
            <UnitTestProvider>
                <CharacterContext.Provider value={enContextValue}>
                    <Flag locale="pl" />
                </CharacterContext.Provider>
            </UnitTestProvider>
        );

        expect(screen.getByRole('button', { name: 'Polski' })).toBeVisible();
        expect(screen.queryByRole('button', { name: 'English' })).not.toBeInTheDocument();
    });

    it('calls changeLocale with correct locale when clicked', async () => {
        const mockChangeLocale = vi.fn();
        const mockContextValue = {
            locale: 'en',
            changeLocale: mockChangeLocale,
        } as any;

        render(
            <UnitTestProvider>
                <CharacterContext.Provider value={mockContextValue}>
                    <Flag locale="pl" />
                </CharacterContext.Provider>
            </UnitTestProvider>
        );
        const user = userEvent.setup();

        const button = screen.getByRole('button', { name: 'Polski' });
        await user.click(button);

        await waitFor(() => expect(mockChangeLocale).toHaveBeenCalledWith('pl'));
    });
});
