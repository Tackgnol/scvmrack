import { render } from 'vitest-browser-react';
import { expect, describe, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { Flag } from '@/components/atoms/Flag';
import BrowserTestProvider from '../BrowserTestProvider';
import { CharacterContext } from '@/CharacterContext/CharacterContext';

describe('Flag Component', () => {
    it('updates the rendered locale button when props change', async () => {
        const mockChangeLocale = vi.fn();
        const enContextValue = {
            locale: 'en',
            changeLocale: mockChangeLocale,
        } as any;

        const { rerender } = await render(
            <BrowserTestProvider>
                <CharacterContext.Provider value={enContextValue}>
                    <Flag locale="en" />
                </CharacterContext.Provider>
            </BrowserTestProvider>
        );

        const button = page.getByRole('button', { name: 'English' });
        await expect.element(button).toBeVisible();

        await rerender(
            <BrowserTestProvider>
                <CharacterContext.Provider value={enContextValue}>
                    <Flag locale="pl" />
                </CharacterContext.Provider>
            </BrowserTestProvider>
        );

        await expect.element(page.getByRole('button', { name: 'Polski' })).toBeVisible();
        await expect.element(page.getByRole('button', { name: 'English' })).not.toBeInTheDocument();
    });

    it('calls changeLocale with correct locale when clicked', async () => {
        const mockChangeLocale = vi.fn();
        const mockContextValue = {
            locale: 'en',
            changeLocale: mockChangeLocale,
        } as any;

        await render(
            <BrowserTestProvider>
                <CharacterContext.Provider value={mockContextValue}>
                    <Flag locale="pl" />
                </CharacterContext.Provider>
            </BrowserTestProvider>
        );

        const button = page.getByRole('button', { name: 'Polski' });
        await userEvent.click(button);

        await expect.poll(() => mockChangeLocale).toHaveBeenCalledWith('pl');
    });
});
